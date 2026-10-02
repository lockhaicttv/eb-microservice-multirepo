import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { catalogApi } from '@/api/api'
import { catalogQueryKey } from '@/api/query-keys.constants'
import usePermissions from '@/hooks/usePermissions'
import useHandleErrors from '@/hooks/useHandleErrors'

/**
 * The current owner's listings.
 *
 * `enabled` is gated on the role so a customer never fires a request the server
 * would reject. That is an optimisation only — catalog-bff and catalog-backend
 * both enforce the capability independently of what the UI renders.
 */
const useGetMyEvents = () => {
  const { hydrated, canManageEvents } = usePermissions()

  return useQuery({
    queryKey: catalogQueryKey.getMyEvents(),
    queryFn: catalogApi.myEvents,
    // Wait for the persisted store before resolving the role: firing earlier
    // would send a request under a role we have not determined yet.
    enabled: hydrated && canManageEvents
  })
}

/**
 * Create an event owned by the caller. On success we invalidate both the owner
 * list and the public browse list, since a new listing is immediately visible to
 * every customer.
 */
export const useCreateEvent = () => {
  const queryClient = useQueryClient()
  const { handleAPIError } = useHandleErrors()

  return useMutation({
    mutationFn: catalogApi.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogQueryKey.getMyEvents() })
      // Prefix match, not an exact key: the browse cache is keyed per search term,
      // and a new listing shows up in the unfiltered list at minimum. Invalidating
      // only `getAllEvents()` would miss every cached search variant.
      queryClient.invalidateQueries({ queryKey: [catalogQueryKey.getAllEvents()[0]] })
    },
    onError: (error) => handleAPIError(error)
  })
}

export default useGetMyEvents
