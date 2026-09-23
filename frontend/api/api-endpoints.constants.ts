export const apiEndpoints = {
  auth: 'auth',
  catalog: 'catalog',
  order: 'order',
  payment: 'payment',
  notification: 'notification'
} as const

export type ApiDomain = (typeof apiEndpoints)[keyof typeof apiEndpoints]
