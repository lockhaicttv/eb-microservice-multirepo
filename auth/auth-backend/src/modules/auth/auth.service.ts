import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { USER_ROLES, User, UserRole, isRole } from '@demo/contracts';
import { UserEntity } from '../../database/user.entity';
import { ASSIGNABLE_ROLES, capabilitiesFor } from './roles';

/** Postgres invalid-text-representation (SQLSTATE 22P02), e.g. a non-uuid id. */
const INVALID_TEXT_REPRESENTATION = '22P02';

/**
 * Ids are uuid columns, so a malformed id is rejected by Postgres. Callers get
 * the same NOT_FOUND as a well-formed id that simply does not exist — otherwise
 * the error shape would confirm which ids are syntactically valid.
 */
function isBadIdError(err: unknown): boolean {
  return err instanceof QueryFailedError && (err as { code?: string }).code === INVALID_TEXT_REPRESENTATION;
}

export interface TokenPayload {
  sub: string;
  email: string;
}

const BCRYPT_ROUNDS = 10;

/** Postgres unique-violation (SQLSTATE 23505). */
const UNIQUE_VIOLATION = '23505';

/** Postgres check-constraint violation (SQLSTATE 23514). */
const CHECK_VIOLATION = '23514';

/** A real bcrypt hash of a random string, used only to equalize login timing. */
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

/**
 * Emails are matched case-insensitively (the previous in-memory store did this).
 * Normalizing on the way in is what keeps the unique index meaningful —
 * otherwise `A@b.dev` and `a@b.dev` would both insert as distinct rows.
 */
const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/**
 * Explicit projection onto the shared contract. The entity also carries
 * `passwordHash`, which must never cross the gRPC boundary.
 *
 * An unrecognised stored role degrades to CUSTOMER rather than being passed
 * through, so a bad row can never grant extra capability.
 */
function toContractUser(entity: UserEntity): User {
  return {
    id: entity.id,
    email: entity.email,
    name: entity.name,
    role: isRole(entity.role) ? entity.role : USER_ROLES.CUSTOMER,
  };
}

/**
 * Domain errors carrying a gRPC status. The controller maps these directly, so
 * the reason code survives the wire and the BFF can branch on it (e.g. 403 vs
 * 401) instead of pattern-matching a message string.
 */
export type AuthErrorCode =
  | 'UNAUTHENTICATED'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'INVALID_ARGUMENT'
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_CREDENTIALS';

export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string, name: string) {
    const normalizedEmail = normalizeEmail(email);

    const record = this.users.create({
      email: normalizedEmail,
      name,
      // Registration can never choose a role. Everyone starts as CUSTOMER and
      // an admin promotes them afterwards.
      role: USER_ROLES.CUSTOMER,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    });

    let saved: UserEntity;
    try {
      saved = await this.users.save(record);
    } catch (err) {
      // The unique index is the real guarantee against duplicate accounts;
      // translate its violation into the contract error the BFF expects.
      if (err instanceof QueryFailedError && (err as { code?: string }).code === UNIQUE_VIOLATION) {
        throw new AuthError('EMAIL_ALREADY_EXISTS', 'EMAIL_ALREADY_EXISTS');
      }
      // The role CHECK constraint should be unreachable from here (registration
      // hardcodes CUSTOMER), so if it ever fires it means the column default and
      // the hardcoded role have drifted apart. Fail loudly instead of silently
      // creating a user with an unusable role.
      if (err instanceof QueryFailedError && (err as { code?: string }).code === CHECK_VIOLATION) {
        this.logger.error(
          'role CHECK constraint violated during register',
          err instanceof Error ? err.stack : undefined,
        );
        throw new AuthError('INVALID_ARGUMENT', 'INTERNAL_ROLE_MISMATCH');
      }
      throw err;
    }

    // Re-read so the returned role comes from the database, not from the object
    // we handed to save(). If a DB default or trigger ever overrode the value,
    // the token/response reflects what was actually persisted.
    const persisted = (await this.users.findOne({ where: { id: saved.id } })) ?? saved;
    const token = this.jwt.sign(this.toPayload(persisted));
    return { accessToken: token, user: toContractUser(persisted) };
  }

  async login(email: string, password: string) {
    const record = await this.users.findOne({ where: { email: normalizeEmail(email) } });

    // Always run a comparison so a missing account and a wrong password take
    // comparable time, then report the same generic error.
    const matches = await bcrypt.compare(password, record?.passwordHash ?? DUMMY_HASH);
    if (!record || !matches) throw new AuthError('INVALID_CREDENTIALS', 'INVALID_CREDENTIALS');

    const token = this.jwt.sign(this.toPayload(record));
    return { accessToken: token, user: toContractUser(record) };
  }

  async validateToken(accessToken: string) {
    const user = await this.resolveUser(accessToken);
    return user ? { valid: true, user } : { valid: false };
  }

  /**
   * Resolve a bearer token to a contract user, or throw. This is the single gate
   * used by the admin operations below, so an unauthenticated caller gets 401
   * (not 403) and never reaches the role check.
   */
  private async resolveUser(accessToken: string): Promise<User> {
    if (!accessToken) throw new AuthError('UNAUTHENTICATED', 'UNAUTHORIZED');

    let payload: TokenPayload;
    try {
      payload = this.jwt.verify<TokenPayload>(accessToken);
    } catch {
      throw new AuthError('UNAUTHENTICATED', 'UNAUTHORIZED');
    }

    const record = await this.users.findOne({ where: { id: payload.sub } }).catch((err: unknown) => {
      if (isBadIdError(err)) throw new AuthError('UNAUTHENTICATED', 'UNAUTHORIZED');
      throw err;
    });
    if (!record) throw new AuthError('UNAUTHENTICATED', 'UNAUTHORIZED');

    return toContractUser(record);
  }

  /**
   * Read the user id out of a token without requiring a capability. Used by the
   * guard in other services that need to know *who* is calling.
   */
  async identify(accessToken: string): Promise<User> {
    return this.resolveUser(accessToken);
  }

  /**
   * Capability check, resolved against the database rather than the token. The
   * JWT deliberately carries no role, so a demotion takes effect immediately
   * instead of persisting until the token expires.
   */
  async assertCapability(accessToken: string, capability: 'view_admin_dashboard' | 'manage_users'): Promise<User> {
    const user = await this.resolveUser(accessToken);
    if (!capabilitiesFor(user.role).includes(capability)) {
      this.logger.warn(`user ${user.id} (${user.role}) denied ${capability}`);
      throw new AuthError('PERMISSION_DENIED', 'FORBIDDEN');
    }
    return user;
  }

  async listUsers(accessToken: string): Promise<User[]> {
    await this.assertCapability(accessToken, 'manage_users');
    const records = await this.users.find({ order: { createdAt: 'ASC' } });
    return records.map(toContractUser);
  }

  /**
   * Promote or demote a user. Refuses to touch the caller's own role so an
   * admin cannot accidentally lock themselves out via the admin UI.
   */
  async setUserRole(accessToken: string, userId: string, role: string): Promise<User> {
    const admin = await this.assertCapability(accessToken, 'manage_users');

    if (!isRole(role)) throw new AuthError('INVALID_ARGUMENT', 'INVALID_ROLE');
    if (!(ASSIGNABLE_ROLES as readonly string[]).includes(role)) {
      throw new AuthError('INVALID_ARGUMENT', 'ROLE_NOT_ASSIGNABLE');
    }
    if (admin.id === userId) {
      throw new AuthError('INVALID_ARGUMENT', 'CANNOT_CHANGE_OWN_ROLE');
    }

    const record = await this.users.findOne({ where: { id: userId } }).catch((err: unknown) => {
      if (isBadIdError(err)) throw new AuthError('NOT_FOUND', 'USER_NOT_FOUND');
      throw err;
    });
    if (!record) throw new AuthError('NOT_FOUND', 'USER_NOT_FOUND');

    record.role = role as UserRole;
    const saved = await this.users.save(record);
    this.logger.log(`admin ${admin.id} set ${saved.id} role -> ${saved.role}`);
    return toContractUser(saved);
  }

  private toPayload(record: UserEntity): TokenPayload {
    return { sub: record.id, email: record.email };
  }
}