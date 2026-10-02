import { USER_ROLES, User, UserRole, isRole } from '@demo/contracts';

export interface RequestContext {
  req: { headers: Record<string, string | string[] | undefined> };
}

/**
 * Role checks happen here against the *freshly validated* user, never against the
 * token contents and never against a role the client sent.
 *
 * Ordering matters: resolve identity first, then capability. A missing token is
 * UNAUTHORIZED (401); a valid token without the role is FORBIDDEN (403).
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

  /**
   * Unknown/missing role -> CUSTOMER. Same fail-closed rule as the gateway, so a
   * role added by a newer backend grants nothing here.
   */
  get role(): UserRole {
    return isRole(this.user.role) ? this.user.role : USER_ROLES.CUSTOMER;
  }

  has(...roles: readonly UserRole[]): boolean {
    return roles.includes(this.role);
  }

  assert(...roles: readonly UserRole[]): void {
    if (!this.has(...roles)) {
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