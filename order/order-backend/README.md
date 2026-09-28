# order-backend

gRPC service for orders plus the Kafka choreography producer in the per-service microservice demo.

- gRPC: `0.0.0.0:5103` (override with `GRPC_URL`)
- Talks to: catalog-backend over gRPC (`CATALOG_GRPC_URL`, default `localhost:5102`) to resolve event/ticket details
- Kafka: consumes `demo.payment.confirmed`/`demo.payment.declined`, produces `demo.order.created`/`demo.order.status.updated`
- Mirrors the flow into Orkes/Conductor (`ORKES_URL`, default `http://localhost:8082/api`) — starts the `order_flow` run

## Run

```bash
npm install
npm run build
npm start:prod
```

Requires Kafka (`localhost:29092`) and catalog-backend to be running.

## Endpoints (proto `OrderService`)

- `CreateOrder`
- `GetOrder`
- `ListOrders`