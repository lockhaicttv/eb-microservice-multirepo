export const catalogQueryKey = {
  getAllEvents: (search?: string) => ['get-all-events', search] as const,
  getEvent: (id: string) => ['get-event', id] as const
}

export const orderQueryKey = {
  getOrders: () => ['get-orders'] as const,
  getOrder: (orderId: string) => ['get-order', orderId] as const
}

export const authQueryKey = {
  getMe: () => ['get-me'] as const
}

export const paymentQueryKey = {
  getPayments: (orderId: string) => ['get-payments', orderId] as const
}

export const notificationQueryKey = {
  getNotifications: () => ['get-notifications'] as const
}
