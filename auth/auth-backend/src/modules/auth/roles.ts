import { USER_ROLES, UserRole, isRole } from '@demo/contracts';

/**
 * Role hierarchy, expressed as capabilities rather than as "higher roles include
 * lower roles".
 *
 * That distinction matters: an EVENT_OWNER must NOT inherit admin powers, so a
 * plain ADMIN > EVENT_OWNER > CUSTOMER ranking would be wrong. ADMIN is the only
 * role that implies every capability; the other two are peers.
 */
export type Capability =
  | 'browse_events'
  | 'buy_tickets'
  | 'manage_own_events'
  | 'view_admin_dashboard'
  | 'manage_users';

const CAPABILITIES: Record<UserRole, readonly Capability[]> = {
  [USER_ROLES.ADMIN]: ['browse_events', 'buy_tickets', 'manage_own_events', 'view_admin_dashboard', 'manage_users'],
  [USER_ROLES.EVENT_OWNER]: ['browse_events', 'buy_tickets', 'manage_own_events'],
  [USER_ROLES.CUSTOMER]: ['browse_events', 'buy_tickets'],
};

/**
 * Unknown or missing role -> CUSTOMER. Least privilege by default: if a token
 * was minted before roles existed, or against a newer contract with a role this
 * build has never seen, the caller gets the minimum set.
 */
export function capabilitiesFor(role: unknown): readonly Capability[] {
  const effective: UserRole = isRole(role) ? role : USER_ROLES.CUSTOMER;
  return CAPABILITIES[effective];
}

export function can(role: unknown, capability: Capability): boolean {
  return capabilitiesFor(role).includes(capability);
}

/**
 * Roles that may be assigned to a user. ADMIN is excluded deliberately: this
 * endpoint promotes a user to a content role, and granting admin should stay a
 * manual, audited operation rather than something reachable from the admin UI.
 */
export const ASSIGNABLE_ROLES: readonly UserRole[] = [USER_ROLES.EVENT_OWNER, USER_ROLES.CUSTOMER];