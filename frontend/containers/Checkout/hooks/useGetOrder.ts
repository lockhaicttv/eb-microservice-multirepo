import { useQuery } from '@tanstack/react-query'
import { orderApi } from '@/api/api'
import { orderQueryKey } from '@/api/query-keys.constants'

const useGetOrder = (orderId: string, enabled = true) => {
  return useQuery({
    queryKey: orderQueryKey.getOrder(orderId),
    queryFn: () => orderApi.order(orderId),
    enabled: Boolean(orderId) && enabled
  })
}

export default useGetOrder
