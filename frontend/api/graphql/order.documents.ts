export const ORDER_DOCUMENTS = {
  CREATE_ORDER: /* GraphQL */ `
    mutation CreateOrder($tickets: [OrderTicketInput!]!) {
      createOrder(tickets: $tickets) {
        id
        userId
        status
        totalAmount
        createdAt
        tickets {
          eventId
          eventName
          quantity
          ticketPrice
        }
      }
    }
  `,
  ORDERS: /* GraphQL */ `
    query Orders {
      orders {
        id
        userId
        status
        totalAmount
        createdAt
        tickets {
          eventId
          eventName
          quantity
          ticketPrice
        }
      }
    }
  `,
  ORDER: /* GraphQL */ `
    query Order($orderId: String!) {
      order(orderId: $orderId) {
        id
        userId
        status
        totalAmount
        createdAt
        tickets {
          eventId
          eventName
          quantity
          ticketPrice
        }
      }
    }
  `,
  ORDER_UPDATED: /* GraphQL */ `
    subscription OrderUpdated($userId: String!) {
      orderUpdated(userId: $userId) {
        orderId
        userId
        status
        previousStatus
        totalAmount
      }
    }
  `
} as const
