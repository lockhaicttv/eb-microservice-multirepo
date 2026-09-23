import { useQueryClient } from '@tanstack/react-query'
import { useStore } from '@/store/useStore'
import useSubscription from '@/hooks/useSubscription'
import { NOTIFICATION_DOCUMENTS } from '@/api/graphql/notification.documents'
import { notificationQueryKey } from '@/api/query-keys.constants'
import { subscriptionUrls } from '@/api/websocket/graphql-ws-client'
import type { NotificationModel } from '@/types/api.types'

const useNotificationCreatedSubscription = () => {
  const queryClient = useQueryClient()
  const userId = useStore((state) => state.user?.id)

  useSubscription<NotificationModel>(
    {
      url: subscriptionUrls.notification,
      query: NOTIFICATION_DOCUMENTS.NOTIFICATION_CREATED,
      variables: userId ? { userId } : undefined,
      onNext: () => {
        queryClient.invalidateQueries({ queryKey: notificationQueryKey.getNotifications() })
      }
    },
    [userId, queryClient]
  )
}

export default useNotificationCreatedSubscription
