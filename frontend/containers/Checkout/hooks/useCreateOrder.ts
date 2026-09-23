import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orderApi } from '@/api/api'
import { orderQueryKey } from '@/api/query-keys.constants'
import useHandleErrors from '@/hooks/useHandleErrors'
import type { OrderTicketInput } from '@/types/api.types'

const useCreateOrder = () => {
  const queryClient = useQueryClient()
  const { handleAPIError } = useHandleErrors()
  return useMutation({
    mutationFn: (tickets: OrderTicketInput[]) => orderApi.createOrder(tickets),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderQueryKey.getOrders() })
    },
    onError: (error) => {
      handleAPIError(error)
    }
  })
}

export default useCreateOrder
