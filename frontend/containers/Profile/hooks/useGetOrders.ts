import { useQuery } from '@tanstack/react-query'
import { orderApi } from '@/api/api'
import { orderQueryKey } from '@/api/query-keys.constants'

const useGetOrders = () => {
  return useQuery({
    queryKey: orderQueryKey.getOrders(),
    queryFn: orderApi.orders
  })
}

export default useGetOrders
