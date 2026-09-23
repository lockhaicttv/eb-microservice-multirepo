import { NOTIFICATION_DOCUMENTS } from './../graphql/notification.documents'
import type { NotificationModel } from '@/types/api.types'
import type { GraphQLClient } from 'graphql-request'

export const createNotificationOperations = (client: GraphQLClient) => ({
  notifications: () =>
    client
      .request<{ notifications: NotificationModel[] }>(NOTIFICATION_DOCUMENTS.NOTIFICATIONS)
      .then((res) => res.notifications)
})

export type NotificationOperations = ReturnType<typeof createNotificationOperations>
