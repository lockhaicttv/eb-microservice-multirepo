import { createClient, type Client } from 'graphql-ws'
import { wsEnv } from '@/constants/env'
import { useStore } from '@/store/useStore'

export interface SubscribeOptions<TPayload> {
  url: string
  query: string
  variables?: Record<string, unknown>
  operationName?: string
  onNext: (payload: TPayload) => void
  onError?: (error: unknown) => void
  onComplete?: () => void
}

const connectionParams = () => {
  const accessToken = useStore.getState().accessToken
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}

const clients = new Map<string, Client>()

const getClient = (url: string): Client => {
  const existing = clients.get(url)
  if (existing) return existing
  const client = createClient({
    url,
    connectionParams,
    retryAttempts: 5,
    lazy: true
  })
  clients.set(url, client)
  return client
}

export const subscribe = <TPayload>(options: SubscribeOptions<TPayload>): (() => void) => {
  const client = getClient(options.url)
  const unsubscribe = client.subscribe(
    {
      query: options.query,
      variables: options.variables,
      operationName: options.operationName
    },
    {
      next: (result) => {
        const value = result.data as Record<string, TPayload> | undefined
        const key = Object.keys(value ?? {})[0]
        if (key && value) options.onNext(value[key])
      },
      error: (error) => {
        options.onError?.(error)
        unsubscribe()
      },
      complete: () => {
        options.onComplete?.()
      }
    }
  )
  return unsubscribe
}

export const disposeClient = (url: string) => {
  const client = clients.get(url)
  if (client) {
    client.dispose()
    clients.delete(url)
  }
}

export const subscriptionUrls = {
  order: wsEnv.orderBffWsUrl,
  notification: wsEnv.notificationBffWsUrl
}
