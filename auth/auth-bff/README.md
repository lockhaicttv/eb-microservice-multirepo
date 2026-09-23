# auth-bff

Per-service GraphQL facade for the auth-backend.

- GraphQL: `http://localhost:4101/demo/auth/graphql` (override `PORT`)
- Talks to: auth-backend over gRPC (`AUTH_GRPC_URL`, default `localhost:5101`)

## Run

```bash
npm install
npm run build
npm start:prod
```

## Schema

- `register(email, password, name)` -> `AuthPayload`
- `login(email, password)` -> `AuthPayload`
- `me` -> `User` (from Bearer token)