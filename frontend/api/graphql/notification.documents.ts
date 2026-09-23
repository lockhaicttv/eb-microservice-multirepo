export const NOTIFICATION_DOCUMENTS = {
  NOTIFICATIONS: /* GraphQL */ `
    query Notifications {
      notifications {
        id
        userId
        type
        message
        createdAt
      }
    }
  `,
  NOTIFICATION_CREATED: /* GraphQL */ `
    subscription NotificationCreated($userId: String!) {
      notificationCreated(userId: $userId) {
        id
        userId
        type
        message
        createdAt
      }
    }
  `
} as const
