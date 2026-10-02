# Microservice Multi-Repo Demo (demo-microservice-multirepo)

A deliberately small showcase for learning **how microservices talk to each other**
in a **multi-repo, contract-first** setup. Each team owns a single domain and
operates **independently on their own git repository**: their own versioning,
their own pipeline, their own deployment. The only shared thing is the contract.

The demo is composed of five domains (`auth`, `catalog`, `order`, `payment`,
`notification`), each decomposed into two independent services:

- a **backend** — gRPC service owning the domain logic (+ side effects),
- a **BFF** (Backend For Frontend) — GraphQL facade exposing that domain to the frontend.

Ten services in total, each a standalone repo under its domain folder:

```text
auth/            catalog/         order/           payment/         notification/
├─ auth-backend  ├─ catalog-backend ├─ order-backend ├─ payment-backend ├─ notification-backend
└─ auth-bff      └─ catalog-bff     └─ order-bff     └─ payment-bff     └─ notification-bff
```

> **Note from the author** — This is the architecture used in a real-world logistics
> project I worked on, where each team owned (and ran) its own module to solve
> complex business problems. In that production project, teams also applied design
> patterns such as clean architecture, hexagonal architecture, or xstate,
> depending on their needs. This demo project was rewritten with a simplified
> business flow on purpose, focusing on how the modules interact with one another
> through **gRPC** and **message queues**, instead of carrying heavyweight
> architectures like DDD, hexagonal, or clean architecture.

## Architecture & inter-service communication

Services exchange information in three complementary ways — all defined by the
shared contract first, then implemented independently per team:

### 1. Contract as the seam (`@demo/contracts`)

A single package (`contracts/`) centralizes the **`.proto`** gRPC definitions,
**typed gRPC clients**, and **Kafka topic constants**. It is published to a
**local Verdaccio registry**. Every service depends only on this package — never
on another team's code — so any team can evolve their service independently as
long as the contract stays compatible.

### 2. Synchronous request/reply over gRPC

- **Frontend → BFF:** browser (Next.js) talks GraphQL over HTTP, with the JWT
  passed in the `Authorization` header (CORS pre-configured for `localhost:3000`).
- **BFF → own backend:** each BFF calls its own gRPC backend using the typed
  client from `@demo/contracts`.
- **Backend → backend:** a realistic seam keeps a classic *request/reply* style in
  front of the async Kafka choreography — e.g. `order-backend` calls
  `catalog-backend` (`GetProduct`) to resolve ticket prices and event names when
  an order is created.
- **Auth verification:** any BFF that needs identity calls `auth-backend`
  (`ValidateToken`) over gRPC before advancing.

### 3. Asynchronous events over Kafka (choreography)

Domain facts are published as events and consumed by whoever cares:

```text
demo.order.created          (order-backend emits)
demo.payment.confirmed      (payment-backend emits)
demo.payment.declined       (payment-backend emits)
demo.order.status.updated   (order-backend emits)
demo.notification.created   (notification-backend emits)
```

The two BFFs with subscriptions (`order-bff`, `notification-bff`) run a
**KafkaBridge** — a Kafka consumer that republishes events into a
`graphql-subscriptions` `PubSub`, which delivers them to the browser over
**GraphQL WebSocket subscriptions** in real time.

### 4. Workflow orchestration mirror (Conductor/Orkes)

`order_flow` is a *mirror* workflow, not the driver. Each backend that sends a
relevant Kafka event reports its stage to Conductor at the exact send point,
using the **order id** as the correlation id. It gives you a visual lifecycle of
the whole business flow: `order.created` → `payment` → `order.updated` →
`notification`.

### End-to-end purchase flow

```text
register/login (auth-bff :4101) -> JWT
  -> createOrder (order-bff :4103, Bearer JWT)
  -> order-bff validates the token via auth-backend gRPC (:5101)
  -> order-backend resolves prices/names via catalog-backend gRPC (:5102)
  -> order-backend emits order.created (Kafka)
      -> payment-backend: amount <= 10000 ? PAID : DECLINED -> payment.confirmed/declined (Kafka)
      -> order-backend: updates order, emits order.status.updated (Kafka)
      -> notification-backend: stores + emits notification.created (Kafka)
  -> order-bff / notification-bff KafkaBridge -> PubSub -> GraphQL subscriptions
  -> every send point mirrors its stage into Orkes/Conductor (order_flow)
```

To force the DECLINED path, buy event `e-5` (VIP Backstage Pass, 12000 > 10000 limit).

## Technologies

| Layer | Tech |
|---|---|
| Backends (gRPC) | Node.js, TypeScript, **NestJS 10**, `@nestjs/microservices` + `@grpc/grpc-js` / `proto-loader` |
| BFFs (GraphQL) | NestJS 10, **Apollo Server** (`@nestjs/apollo`, `@nestjs/graphql`), `graphql-ws`, `graphql-subscriptions` |
| Contract | Protobuf — one `demo.proto`, typed clients & Kafka topics in `@demo/contracts` |
| Events | **Apache Kafka** (`kafkajs`) + Kafka UI |
| Auth | **JWT** (`@nestjs/jwt`) issued by `auth-backend`; roles resolved from Postgres on every validation |
| Persistence | **PostgreSQL** + **TypeORM** — one database per domain, migrations only |
| Workflow | **Orkes / Conductor** workflow engine |
| Registry | **Verdaccio** — local private npm registry for `@demo/contracts` |
| Frontend | **Next.js 16** (Turbopack), React 19, **TanStack Query**, `graphql-request`, `graphql-ws`, **Zustand**, Tailwind CSS 4 |
| Infra | Docker Compose (Kafka, Kafka UI, Verdaccio, Conductor) |

## Repository layout

| Repo/dir | Scope | Port |
|---|---|---|
| `contracts/` | `@demo/contracts` — one `demo.proto`, typed gRPC clients, Kafka topic constants. Published to a local Verdaccio registry. | npm `http://localhost:4873` |
| `auth/auth-backend/` | gRPC service — register/login/validate-token (JWT), user roles, admin user management. Owns the `auth` database. | gRPC `:5101` |
| `auth/auth-bff/` | GraphQL facade for auth, incl. role-aware `me`, admin `users` / `setUserRole`. | HTTP/WS `:4101/demo/auth/graphql` |
| `catalog/catalog-backend/` | gRPC service — event catalog (seeded demo events). | gRPC `:5102` |
| `catalog/catalog-bff/` | GraphQL facade for catalog. | HTTP/WS `:4102/demo/catalog/graphql` |
| `order/order-backend/` | gRPC service — orders; Kafka producer; calls catalog over gRPC; starts the Orkes `order_flow`. | gRPC `:5103` |
| `order/order-bff/` | GraphQL facade for orders + subscriptions. | HTTP/WS `:4103/demo/order/graphql` |
| `payment/payment-backend/` | gRPC service — payments; Kafka consumer/producer. | gRPC `:5104` |
| `payment/payment-bff/` | GraphQL facade for payments. | HTTP/WS `:4104/demo/payment/graphql` |
| `notification/notification-backend/` | gRPC service — notifications; Kafka consumer/producer. | gRPC `:5105` |
| `notification/notification-bff/` | GraphQL facade for notifications + subscriptions. | HTTP/WS `:4105/demo/notification/graphql` |
| `frontend/` | Next.js app for Pulse Events. | HTTP `:3000` |

## Run the project locally

### 0. Prerequisites

- Node 20+, npm, pnpm
- Docker (for infra)

### 1. Start the infrastructure

```bash
docker compose up -d
```

- Postgres `localhost:5432` (user `demo` / `demo123`) — one database per domain:
  `auth`, `catalog`, `order`, `payment`, `notification`
- Kafka broker `localhost:29092` (host apps); Kafka UI `http://localhost:8080`
- Verdaccio `http://localhost:4873` (user `demo` / `demo123`)
- Conductor/Orkes UI `http://localhost:8082`

### 2. Publish the contract (once, when the contract changes)

```bash
cd contracts
npm install
npm run build
npm publish
```

Every service repo carries an `.npmrc` pointing `@demo:*` at `http://localhost:4873`,
so version bumps flow down on the next `npm install`.

### 3. Start the backends

For each of `auth/auth-backend`, `catalog/catalog-backend`, `order/order-backend`,
`payment/payment-backend`, `notification/notification-backend`:

```bash
cd <domain>/<service>
npm install
npm run migration:run     # only where a database exists (see below)
npm run seed              # optional demo data
npm run build
npm start:prod
```

Backends listen on `:5101`–`:5105`. Cross-service URLs and infra are configurable
via env vars (e.g. `GRPC_URL`, `CATALOG_GRPC_URL`, `AUTH_GRPC_URL`, `KAFKA_BROKER`,
`ORKES_URL`, `ORKES_ENABLED`); defaults match localhost. See each repo's README.

> Start order-backend after catalog-backend and Kafka, since it depends on them.

### 4. Start the BFFs

For each of `auth/auth-bff`, `catalog/catalog-bff`, `order/order-bff`,
`payment/payment-bff`, `notification/notification-bff`:

```bash
cd <domain>/<service>
npm install
npm run build
npm start:prod
```

BFFs listen on `:4101`–`:4105` (`/demo/<domain>/graphql`, HTTP + WS on the same path).

### 5. Start the frontend

```bash
cd frontend
cp .env.example .env.local   # defaults already point at localhost BFFs
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

### How to test the flow

1. Register / log in (`auth-bff` — you get a JWT).
2. Browse events on the home page, open an event detail (`catalog-bff`).
3. Add tickets to the cart and go to checkout — `createOrder` runs
   (`payment-bff` status is polled until the decision lands).
4. Watch the order status update **live** via the GraphQL subscription.
   Events under the 10000 limit are `PAID`; buy `e-5` to see `DECLINED`.
5. Check the wallet/orders/notifications in the Profile and Notifications pages
   (`payment-bff`, `order-bff`, `notification-bff`).
6. Open `http://localhost:8082` → Workflows → `order_flow` to watch the
   correlation across services.

## Notes

- State is **in-memory** per service (events, orders, payments, notifications);
  restarting a service clears its data. `auth` is the exception: it persists to
  Postgres, so accounts survive a restart.
- The BFFs are thin: auth checks, field mapping, and the event bridge. Business
  rules (payment limits, order lifecycle) live in the backends, EQM-style.
- The gRPC wire keeps the `products` vocabulary (contract-first, `@demo/contracts`
  v0.4.1); the event/ticket domain is exposed at the BFF GraphQL layer.

## Roles

`auth-backend` is the single source of truth for authorization. Roles are stored
in `users.role` (`ADMIN`, `EVENT_OWNER`, `CUSTOMER`) and returned by
`ValidateToken`, so every BFF learns a caller's role from the auth service it
already talks to.

Three decisions worth knowing before extending this to other domains:

- **The role is not in the JWT.** It is resolved from the database on every
  validation, so a demotion takes effect immediately rather than lingering until
  the token expires. The trade-off is one extra query per validation.
- **Registration always creates `CUSTOMER`.** There is no role argument anywhere
  on the register path — a client can never pick its own role. An admin promotes
  a user through `SetUserRole`, which itself only moves between `CUSTOMER` and
  `EVENT_OWNER`; granting `ADMIN` is a manual, audited database operation.
- **Roles are capabilities, not a ranking.** `ADMIN > EVENT_OWNER > CUSTOMER`
  would be wrong, since an event owner must not inherit admin powers. `ADMIN` is
  the only role implying every capability. Unknown role values fail closed to
  `CUSTOMER` in the backend, the BFF, and the frontend.

Backend-side authorization is **not** delegated to the BFF. Admin operations take
the caller's own `accessToken` and re-verify it against the auth database, so
reaching a gRPC port directly does not bypass the role check. The BFF's own check
is a UX affordance that produces a friendly error before the round trip.

Frontend gating (`usePermissions`, the `/admin` route guard) is presentation only
and deliberately duplicates none of that enforcement.

Current coverage: role storage, enforcement, and the admin user list are done for
**auth**. The admin page lists users and promotes owners; the cross-domain
"see all data" views (all orders, payments, notifications, events) and the
owner-only event-creation flow are not implemented yet.
- CORS is scoped to `http://localhost:3000` on every BFF.
- Set `ORKES_ENABLED=false` to run the demo without Conductor.