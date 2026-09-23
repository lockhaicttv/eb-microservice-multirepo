import { PAYMENT_DOCUMENTS } from './../graphql/payment.documents'
import type { PaymentModel } from '@/types/api.types'
import type { GraphQLClient } from 'graphql-request'

export const createPaymentOperations = (client: GraphQLClient) => ({
  payments: (orderId: string) =>
    client.request<{ payments: PaymentModel[] }>(PAYMENT_DOCUMENTS.PAYMENTS, { orderId }).then((res) => res.payments)
})

export type PaymentOperations = ReturnType<typeof createPaymentOperations>
