# catalog-bff

Per-service GraphQL facade for the catalog-backend, exposing the **event/ticket** surface.

- GraphQL: `http://localhost:4102/demo/catalog/graphql` (override `PORT`)
- Talks to: catalog-backend over gRPC (`CATALOG_GRPC_URL`, default `localhost:5102`)
- Renames `products` wire -> `events`; `price` -> `ticketPrice`, `stock` -> `ticketsLeft`

## Run

```bash
npm install
npm run build
npm start:prod
```

## Schema

- `events(search?)` -> `[Event]` (public)
- `event(id)` -> `Event` (public)