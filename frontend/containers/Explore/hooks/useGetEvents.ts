import { useQuery } from '@tanstack/react-query'
import { catalogApi } from '@/api/api'
import { catalogQueryKey } from '@/api/query-keys.constants'

const useGetEvents = (search?: string) => {
  return useQuery({
    queryKey: catalogQueryKey.getAllEvents(search),
    queryFn: () => catalogApi.events(search)
  })
}

export default useGetEvents
