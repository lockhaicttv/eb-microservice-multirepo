export const env = {
  authBffUrl: process.env.NEXT_PUBLIC_AUTH_BFF_URL ?? `http://localhost:4101/demo/auth/graphql`,
  catalogBffUrl: process.env.NEXT_PUBLIC_CATALOG_BFF_URL ?? `http://localhost:4102/demo/catalog/graphql`,
  orderBffUrl: process.env.NEXT_PUBLIC_ORDER_BFF_URL ?? `http://localhost:4103/demo/order/graphql`,
  paymentBffUrl: process.env.NEXT_PUBLIC_PAYMENT_BFF_URL ?? `http://localhost:4104/demo/payment/graphql`,
  notificationBffUrl: process.env.NEXT_PUBLIC_NOTIFICATION_BFF_URL ?? `http://localhost:4105/demo/notification/graphql`
}

const toWsUrl = (httpUrl: string) => httpUrl.replace(/^http/, 'ws')

export const wsEnv = {
  orderBffWsUrl: toWsUrl(env.orderBffUrl),
  notificationBffWsUrl: toWsUrl(env.notificationBffUrl)
}

export const DEFAULT_ORDER_TOTAL_LIMIT = 10000
