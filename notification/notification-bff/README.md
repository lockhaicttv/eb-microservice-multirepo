# notification-bff

Per-service GraphQL facade for the notification-backend with notification subscriptions.

- GraphQL: `http://localhost:4105/demo/notification/graphql` (override `PORT`)
- Talks to: notification-backend over gRPC (`NOTIFICATION_GRPC_URL`, default `localhost:5105`)
- Validates Bearer tokens via auth-backend (`AUTH_GRPC_URL`, default `localhost:5101`)
- Kafka bridge (`localhost:9092`) streams `demo.notification.created` to the `notificationCreated` subscription

## Run

```bash
npm install
npm run build
npm start:prod
```

## Schema

- `notifications` -> `[Notification]` (auth)
- `notificationCreated(userId)` -> `Notification` (subscription)