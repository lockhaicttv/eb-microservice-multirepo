# auth-backend

gRPC service for authentication in the per-service microservice demo.

- gRPC: `0.0.0.0:5101` (override with `GRPC_URL`)
- Deals with: register, login, validate token, user roles, admin user management
- Dependencies: `@demo/contracts` (local verdaccio), `@nestjs/jwt`, TypeORM + Postgres

## Roles

This service is the single source of truth for authorization. Roles live in the
`users.role` column and are resolved from the database on every
`ValidateToken` — deliberately **not** read from the JWT, so a promotion or
demotion takes effect on the token the user is already holding instead of
waiting for it to expire.

| Role | Can |
|---|---|
| `ADMIN` | Everything an owner can, plus the admin dashboard and user management |
| `EVENT_OWNER` | Browse, buy, and manage their own events |
| `CUSTOMER` | Browse and buy |

Design notes:

- **Registration always creates `CUSTOMER`.** There is no role argument on
  `Register` — a client can never choose its own role. Owners are promoted by an
  admin through `SetUserRole`.
- **Roles are capabilities, not a ranking.** `ADMIN > EVENT_OWNER > CUSTOMER` would
  be wrong: an event owner must not inherit admin powers. `ADMIN` is the only role
  that implies every capability; the other two are peers (see
  `src/modules/auth/roles.ts`).
- **`ADMIN` is not assignable via the API.** `SetUserRole` only moves a user
  between `EVENT_OWNER` and `CUSTOMER`, so an admin UI cannot escalate anyone.
  The first admin is created by `npm run seed`; further admins are a manual,
  audited database operation.
- **Unknown roles fail closed.** An unrecognised value degrades to `CUSTOMER`
  rather than being passed through, in the backend, the BFF, and the frontend.
  The role is a plain string on the wire (not a proto enum) so a service running
  an older contract still parses a role it has never seen.
- The role column carries a DB `CHECK` constraint, so an invalid role cannot be
  persisted even if application validation is bypassed.

### Demo accounts

| Email | Password | Role |
|---|---|---|
| `admin@demo.dev` | `admin123` | `ADMIN` |
| `alice@demo.dev` | `alice123` | `CUSTOMER` (promote to owner from `/admin`) |
| `bob@demo.dev` | `bob123` | `CUSTOMER` |
| `carol@demo.dev` | `carol123` | `CUSTOMER` |

No owner is seeded on purpose, so the admin "make owner" flow is reachable.

## Database

Owns the **`auth` database** — no other service reads or writes it. Everyone else
resolves identity over gRPC.

- ORM: TypeORM, entity in `src/database/user.entity.ts`
- Schema: **migrations only** (`synchronize` is off, so a running database is never
  silently rewritten from entity metadata)
- Passwords: bcrypt (cost 10). `password_hash` is deliberately not part of the
  shared `User` contract message, so it cannot leak across the gRPC wire.
- Connection: `DATABASE_URL`, default `postgres://demo:demo123@localhost:5432/auth`

## Run

```bash
cp .env.example .env        # optional; defaults match docker-compose
npm install
npm run migration:run       # create/upgrade the schema
npm run seed                # optional: demo accounts (see Roles above)
npm run build
npm start:prod
```

## Migrations

```bash
npm run migration:show                  # what is applied / what is pending
npm run migration:run                   # apply pending
npm run migration:revert                # roll back the last one
npm run migration:generate -- src/database/migrations/Name  # scaffold from entity diff
```

`npm run seed` is idempotent — it skips accounts that already exist, so it never
resets a password you changed by hand. It *does* reconcile a seeded account's
role, because otherwise an account whose role was lost (a dropped and re-added
column, say) could never be restored: promotion requires an admin, and if the
only admin lost its role there would be no way back.

## Env

| Var | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgres://demo:demo123@localhost:5432/auth` | Postgres connection |
| `DB_MIGRATIONS_RUN` | `false` | Run pending migrations on boot |
| `DB_SYNCHRONIZE` | `false` | Escape hatch: derive schema from entities (throwaway DBs only) |
| `DB_LOGGING` | `false` | Log every SQL statement |
| `GRPC_URL` | `0.0.0.0:5101` | gRPC bind address |
| `JWT_SECRET` | dev placeholder | Signing secret |

## Endpoints (proto `AuthService`)

- `Register`
- `Login`
- `ValidateToken`
- `ListUsers` — admin only
- `SetUserRole` — admin only

Every other service validates JWTs by calling this service (via its BFF or directly over gRPC).

### Admin operations take a token, not a role

`ListUsers` and `SetUserRole` receive the **caller's own `accessToken`** rather
than a role or user id asserted by the caller. The backend re-verifies that token
against its own database and enforces the role itself.

This is deliberate. The BFF also checks the role, but that check is a UX
affordance — the BFF is not the security boundary. If these methods trusted a
`role` field or a caller-supplied identity, anyone able to reach the gRPC port
directly would bypass the BFF entirely. See "trust the BFF" vs "re-verify" in the
root README.

Domain errors map to real gRPC status codes, so a caller can distinguish
`UNAUTHENTICATED` (401) from `PERMISSION_DENIED` (403) without parsing strings:

| Code | When |
|---|---|
| `INVALID_ARGUMENT` + `EMAIL_ALREADY_EXISTS` | Email already registered |
| `INVALID_ARGUMENT` + `INVALID_CREDENTIALS` | Wrong email or password (identical for both) |
| `INVALID_ARGUMENT` + `INVALID_ROLE` | Role value not recognised |
| `INVALID_ARGUMENT` + `ROLE_NOT_ASSIGNABLE` | Attempt to grant `ADMIN` |
| `INVALID_ARGUMENT` + `CANNOT_CHANGE_OWN_ROLE` | Admin targeting itself |
| `UNAUTHENTICATED` | Missing, malformed, or expired token |
| `PERMISSION_DENIED` | Valid token, insufficient role |
| `NOT_FOUND` | User does not exist |

Login returns the same error for an unknown account and a wrong password, so it
does not reveal which accounts exist, and compares against a dummy hash when no
account matches so the two cases take comparable time.