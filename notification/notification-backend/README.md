# notification-backend

gRPC service for **event-ticket notifications** plus the Kafka choreography consumer/producer in the per-service microservice demo.

- gRPC: `0.0.0.0:5105` (override with `GRPC_URL`)
- Kafka: consumes `demo.payment.confirmed`/`demo.payment.declined`, produces `demo.notification.created`
- Notification types: `TICKETS_CONFIRMED` / `TICKETS_DECLINED`
- Mirrors the notification stage into Orkes/Conductor (`ORKES_URL`, default `http://localhost:8082/api`)

## Run

```bash
npm install
npm run build
npm start:prod
```

Requires Kafka (`localhost:9092`).

## Endpoints (proto `NotificationService`)

- `ListNotifications`