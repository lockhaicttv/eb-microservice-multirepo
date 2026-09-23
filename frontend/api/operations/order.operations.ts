import { ORDER_DOCUMENTS } from './../graphql/order.documents'
import type { OrderModel, OrderStatusUpdateModel, OrderTicketInput } from '@/types/api.types'
import type { GraphQLClient } from 'graphql-request'

export const createOrderOperations = (client: GraphQLClient) => ({
  createOrder: (tickets: OrderTicketInput[]) =>
    client
      .request<{ createOrder: OrderModel }>(ORDER_DOCUMENTS.CREATE_ORDER, { tickets })
      .then((res) => res.createOrder),

  orders: () => client.request<{ orders: OrderModel[] }>(ORDER_DOCUMENTS.ORDERS).then((res) => res.orders),

  order: (orderId: string) =>
    client.request<{ order: OrderModel | null }>(ORDER_DOCUMENTS.ORDER, { orderId }).then((res) => res.order)
})

export type OrderOperations = ReturnType<typeof createOrderOperations>

export type { OrderStatusUpdateModel }
