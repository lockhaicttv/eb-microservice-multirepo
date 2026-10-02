import { USER_ROLES, normalizeRole } from '@/types/user.types'
import type { UserRole } from '@/types/api.types'
import { useStore, useStoreHydrated } from '@/store/useStore'

/**
 * UI-side capability checks.
 *
 * IMPORTANT: these are for rendering only — they decide what to show, not what
 * is allowed. Every capability is re-checked server-side (the BFF asserts the
 * role, and the backend independently re-verifies the token). Hiding a button is
 * a UX affordance, never a security control.
 *
 * `hydrated` is false until the persisted store has rehydrated, during which the
 * role is reported as CUSTOMER. Callers must not redirect or render
 * role-exclusive UI until it is true — otherwise a logged-in admin is briefly
 * indistinguishable from a guest and gets bounced off their own page.
 */
export const usePermissions = () => {
  const user = useStore((state) => state.user)
  const hydrated = useStoreHydrated()
  const role: UserRole = hydrated ? normalizeRole(user?.role) : USER_ROLES.CUSTOMER

  return {
    role,
    hydrated,
    isAuthenticated: hydrated && Boolean(user),
    isAdmin: role === USER_ROLES.ADMIN,
    isEventOwner: role === USER_ROLES.EVENT_OWNER,
    /** Owners manage their own events; admins do too. */
    canManageEvents: role === USER_ROLES.EVENT_OWNER || role === USER_ROLES.ADMIN,
    canViewAdminDashboard: role === USER_ROLES.ADMIN,
    /** Everyone signed in can browse and buy. */
    canBuyTickets: hydrated && Boolean(user)
  }
}

export default usePermissions