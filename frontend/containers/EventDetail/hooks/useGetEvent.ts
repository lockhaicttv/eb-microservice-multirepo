import { useQuery } from '@tanstack/react-query'
import { catalogApi } from '@/api/api'
import { catalogQueryKey } from '@/api/query-keys.constants'

const useGetEvent = (id: string) => {
  return useQuery({
    queryKey: catalogQueryKey.getEvent(id),
    queryFn: () => catalogApi.event(id),
    enabled: Boolean(id)
  })
}

export default useGetEvent
