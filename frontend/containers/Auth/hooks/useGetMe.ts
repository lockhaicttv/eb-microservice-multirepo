import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/api'
import { authQueryKey } from '@/api/query-keys.constants'
import { useStore } from '@/store/useStore'

const useGetMe = () => {
  const accessToken = useStore((state) => state.accessToken)

  return useQuery({
    queryKey: authQueryKey.getMe(),
    queryFn: authApi.me,
    enabled: Boolean(accessToken)
  })
}

export default useGetMe

export const useLogout = () => {
  const clearAuthentication = useStore((state) => state.clearAuthentication)
  const queryClient = useQueryClient()
  return () => {
    clearAuthentication()
    queryClient.invalidateQueries({ queryKey: authQueryKey.getMe() })
  }
}
