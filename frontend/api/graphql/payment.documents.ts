export const PAYMENT_DOCUMENTS = {
  PAYMENTS: /* GraphQL */ `
    query Payments($orderId: String!) {
      payments(orderId: $orderId) {
        id
        orderId
        userId
        status
        totalAmount
        reason
        createdAt
      }
    }
  `
} as const
