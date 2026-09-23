# catalog-backend

gRPC service for the **event catalog** in the per-service microservice demo.

- gRPC: `0.0.0.0:5102` (override with `GRPC_URL`)
- Deals with: event/ticket listing + search (in-memory seed = demo events)
- Dependencies: `@demo/contracts` (local verdaccio)

Seed events (wire type `Product`; `name`→event title, `price`→ticket price, `stock`→tickets left):

| id | title | ticket price | tickets |
|----|-------|-------------|---------|
| e-1 | Acoustic Night – Nguyễn Du Garden | 25 | 200 |
| e-2 | Indie Live at The Wall | 60 | 120 |
| e-3 | Tech Summit 2026 (All-Access) | 300 | 40 |
| e-4 | Weekend Festival 3-Day Pass | 1200 | 30 |
| e-5 | VIP Backstage Pass | 12000 | 5 |

`e-5` is priced so a single ticket order exceeds the payment limit (10000) — triggers DECLINED.

## Run

```bash
npm install
npm run build
npm start:prod
```

## Endpoints (proto `CatalogService`)

- `ListProducts`
- `GetProduct`

The order-backend resolves event names/ticket prices by calling `GetProduct` over gRPC when an order is created.