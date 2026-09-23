# order-bff

Per-service GraphQL facade for the order-backend with **ticket order** status subscriptions.

- GraphQL: `http://localhost:4103/demo/order/graphql` (override `PORT`)
- Talks to: order-backend over gRPC (`ORDER_GRPC_URL`, default `localhost:5103`)
- Validates Bearer tokens via auth-backend (`AUTH_GRPC_URL`, default `localhost:5101`)
- Kafka bridge (`localhost:9092`) streams `demo.order.status.updated` to the `orderUpdated` subscription
- Ticket vocabulary: `createOrder(tickets: [{eventId, quantity}])`; wire keeps `productId`

## Run

```bash
npm install
npm run build
npm start:prod
```

## Schema

- `createOrder(tickets)` -> `Order` (auth)
- `order(orderId)` -> `Order`
- `orders` -> `[Order]` (auth)
- `orderUpdated(userId)` -> `OrderStatusUpdate` (subscription)