import { authClient, notificationClient, orderClient, paymentClient, catalogClient } from './graphql-clients'
import { createAuthOperations } from './operations/auth.operations'
import { createCatalogOperations } from './operations/catalog.operations'
import { createOrderOperations } from './operations/order.operations'
import { createPaymentOperations } from './operations/payment.operations'
import { createNotificationOperations } from './operations/notification.operations'

export const authApi = createAuthOperations({ client: authClient })
export const catalogApi = createCatalogOperations(catalogClient)
export const orderApi = createOrderOperations(orderClient)
export const paymentApi = createPaymentOperations(paymentClient)
export const notificationApi = createNotificationOperations(notificationClient)
