import { useQuery } from '@tanstack/react-query'
import { notificationApi } from '@/api/api'
import { notificationQueryKey } from '@/api/query-keys.constants'
import { useStore } from '@/store/useStore'

const useGetNotifications = () => {
  const accessToken = useStore((state) => state.accessToken)
  return useQuery({
    queryKey: notificationQueryKey.getNotifications(),
    queryFn: notificationApi.notifications,
    enabled: Boolean(accessToken)
  })
}

export default useGetNotifications
