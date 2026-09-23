# payment-backend

gRPC service for payments plus the Kafka choreography consumer/producer in the per-service microservice demo.

- gRPC: `0.0.0.0:5104` (override with `GRPC_URL`)
- Kafka: consumes `demo.order.created`, produces `demo.payment.confirmed`/`demo.payment.declined`
- Decision rule: `totalAmount <= 10000` -> PAID, otherwise DECLINED
- Mirrors the payment stage into Orkes/Conductor (`ORKES_URL`, default `http://localhost:8082/api`)

## Run

```bash
npm install
npm run build
npm start:prod
```

Requires Kafka (`localhost:9092`).

## Endpoints (proto `PaymentService`)

- `ListPayments`