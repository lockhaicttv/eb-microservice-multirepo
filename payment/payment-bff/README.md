# payment-bff

Per-service GraphQL facade for the payment-backend.

- GraphQL: `http://localhost:4104/demo/payment/graphql` (override `PORT`)
- Talks to: payment-backend over gRPC (`PAYMENT_GRPC_URL`, default `localhost:5104`)
- Validates Bearer tokens via auth-backend (`AUTH_GRPC_URL`, default `localhost:5101`)

## Run

```bash
npm install
npm run build
npm start:prod
```

## Schema

- `payments(orderId)` -> `[Payment]` (auth)