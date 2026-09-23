import { useStore } from '@/store/useStore'
import useSubscription from '@/hooks/useSubscription'
import { ORDER_DOCUMENTS } from '@/api/graphql/order.documents'
import { subscriptionUrls } from '@/api/websocket/graphql-ws-client'
import type { OrderStatusUpdateModel } from '@/types/api.types'

const useOrderUpdatedSubscription = (onUpdate: (update: OrderStatusUpdateModel) => void) => {
  const userId = useStore((state) => state.user?.id)

  useSubscription<OrderStatusUpdateModel>(
    {
      url: subscriptionUrls.order,
      query: ORDER_DOCUMENTS.ORDER_UPDATED,
      variables: userId ? { userId } : undefined,
      onNext: (update) => onUpdate(update)
    },
    [userId]
  )
}

export default useOrderUpdatedSubscription
