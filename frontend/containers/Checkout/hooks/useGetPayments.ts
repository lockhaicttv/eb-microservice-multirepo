import { useQuery } from '@tanstack/react-query'
import { paymentApi } from '@/api/api'
import { paymentQueryKey } from '@/api/query-keys.constants'

const useGetPayments = (orderId: string, enabled = true) => {
  return useQuery({
    queryKey: paymentQueryKey.getPayments(orderId),
    queryFn: () => paymentApi.payments(orderId),
    enabled: Boolean(orderId) && enabled,
    refetchInterval: (query) => (query.state.data?.[0]?.status === 'PENDING' ? 3000 : false)
  })
}

export default useGetPayments
