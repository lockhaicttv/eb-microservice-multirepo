import { QueryClient } from '@tanstack/react-query'

let browserQueryClient: QueryClient | undefined

export const getQueryClient = (): QueryClient => {
  if (typeof window === 'undefined') return new QueryClient()
  browserQueryClient ??= new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
        retry: 1
      }
    }
  })
  return browserQueryClient
}
