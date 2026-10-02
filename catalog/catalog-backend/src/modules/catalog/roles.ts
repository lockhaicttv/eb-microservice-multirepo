import { USER_ROLES, UserRole, isRole } from '@demo/contracts';

/**
 * The subset of the capability model that catalog-backend enforces.
 *
 * This is an intentional duplicate of the map in auth-backend
 * (`src/modules/auth/roles.ts`), not a shared import. Services in this repo do
 * not depend on each other's code, so each one states the capabilities it guards
 * itself. Keeping the list here to exactly the two catalog decisions makes the
 * duplication small enough to review: if a new capability is added to the model,
 * this file is visibly missing it.
 *
 * Roles are capabilities, not a ranking. ADMIN is the only role that implies
 * everything; EVENT_OWNER and CUSTOMER are peers relative to each other.
 */
export type CatalogCapability = 'browse_events' | 'manage_own_events';

const CATALOG_CAPABILITIES: Record<UserRole, readonly CatalogCapability[]> = {
  [USER_ROLES.ADMIN]: ['browse_events', 'manage_own_events'],
  [USER_ROLES.EVENT_OWNER]: ['browse_events', 'manage_own_events'],
  [USER_ROLES.CUSTOMER]: ['browse_events'],
};

/**
 * Least privilege by default: an unknown or missing role degrades to CUSTOMER,
 * so a role introduced by a newer auth-backend grants nothing to an older
 * catalog-backend.
 */
export function canManageOwnEvents(role: unknown): boolean {
  const effective: UserRole = isRole(role) ? role : USER_ROLES.CUSTOMER;
  return CATALOG_CAPABILITIES[effective].includes('manage_own_events');
}
