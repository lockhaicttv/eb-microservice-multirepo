import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/api'
import { authQueryKey } from '@/api/query-keys.constants'
import usePermissions from '@/hooks/usePermissions'
import useHandleErrors from '@/hooks/useHandleErrors'
import type { UserRole } from '@/types/api.types'

/**
 * Admin user list.
 *
 * `enabled` is gated on the role so a non-admin never fires a request that the
 * server would reject. This is only an optimisation — auth-bff enforces the
 * role independently.
 */
const useGetUsers = () => {
  const { hydrated, canViewAdminDashboard } = usePermissions()

  return useQuery({
    queryKey: authQueryKey.getUsers(),
    queryFn: authApi.users,
    // Wait for the persisted store, then only for admins: firing before
    // hydration would either 401 or hit the server with a role we have not
    // resolved yet.
    enabled: hydrated && canViewAdminDashboard
  })
}

/**
 * Promote or demote a user. On success we invalidate both the admin list and
 * `me`: if an admin changes their own record the cached role could otherwise be
 * stale, and it also covers the promoted user's next session without a re-login.
 */
export const useSetUserRole = () => {
  const queryClient = useQueryClient()
  const { handleAPIError } = useHandleErrors()

  return useMutation({
    mutationFn: (params: { userId: string; role: UserRole }) => authApi.setUserRole(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKey.getUsers() })
      queryClient.invalidateQueries({ queryKey: authQueryKey.getMe() })
    },
    onError: (error) => handleAPIError(error)
  })
}

export default useGetUsers