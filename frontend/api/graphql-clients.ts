import { GraphQLClient } from 'graphql-request'
import { env } from '@/constants/env'
import { useStore } from '@/store/useStore'

const authorizedHeaders = () => {
  const accessToken = useStore.getState().accessToken
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}

const createClient = (url: string) =>
  new GraphQLClient(url, {
    credentials: 'include',
    requestMiddleware: (request) => ({
      ...request,
      headers: {
        'content-type': 'application/json',
        ...authorizedHeaders()
      } as Record<string, string>
    })
  })

export const authClient = createClient(env.authBffUrl)
export const catalogClient = createClient(env.catalogBffUrl)
export const orderClient = createClient(env.orderBffUrl)
export const paymentClient = createClient(env.paymentBffUrl)
export const notificationClient = createClient(env.notificationBffUrl)
