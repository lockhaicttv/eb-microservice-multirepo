import { USER_ROLES, User, UserRole, isRole } from '@demo/contracts';

export interface RequestContext {
  req: { headers: Record<string, string | string[] | undefined> };
}

/**
 * Duplicated from auth-bff on purpose. BFFs in this repo are independent
 * facades over different backends and none may depend on another's code, so the
 * identity-then-capability ordering is restated here rather than imported.
 *
 * What this is *not*: a security boundary. catalog-backend re-validates the same
 * token for every owner-scoped call, so a BFF that forgot to check a role would
 * still be refused. These checks exist to return an honest 401/403 instead of
 * letting a mistake surface as a confusing gRPC error.
 */
export class AuthContext {
  private constructor(readonly user: User) {}

  static async from(ctx: RequestContext, validate: (token: string) => Promise<User | null>): Promise<AuthContext> {
    const token = extractToken(ctx);
    if (!token) throw new Error('UNAUTHORIZED');

    const user = await validate(token);
    if (!user) throw new Error('UNAUTHORIZED');

    return new AuthContext(user);
  }

  get id(): string {
    return this.user.id;
  }

  /** The verified caller — never a role the client asserted. */
  get role(): UserRole {
    return isRole(this.user.role) ? this.user.role : USER_ROLES.CUSTOMER;
  }

  has(...roles: readonly UserRole[]): boolean {
    return roles.includes(this.role);
  }

  /**
   * Owners manage their own events, and admins do too. Roles are capabilities
   * rather than a ranking, so this is an explicit pair instead of "role >= owner".
   */
  assertEventManager(): void {
    if (!this.has(USER_ROLES.EVENT_OWNER, USER_ROLES.ADMIN)) {
      throw new ForbiddenError(this.role);
    }
  }
}

export class ForbiddenError extends Error {
  constructor(readonly role: UserRole) {
    super('FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export function extractToken(ctx: RequestContext): string | null {
  const header = ctx.req.headers?.['authorization'];
  if (!header) return null;
  const value = Array.isArray(header) ? header[0] : header;
  return value.startsWith('Bearer ') ? value.slice(7) : value;
}
