# auth-backend

gRPC service for authentication in the per-service microservice demo.

- gRPC: `0.0.0.0:5101` (override with `GRPC_URL`)
- Deals with: register, login, validate token
- Dependencies: `@demo/contracts` (local verdaccio), `@nestjs/jwt`

## Run

```bash
npm install
npm run build
npm start:prod
```

## Endpoints (proto `AuthService`)

- `Register`
- `Login`
- `ValidateToken`

Every other service validates JWTs by calling this service (via its BFF or directly over gRPC).