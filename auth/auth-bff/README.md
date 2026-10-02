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
- `me` -> `User` (from Bearer token, includes `role`; `null` when signed out)
- `users` -> `[User!]!` — **admin only**
- `setUserRole(userId, role)` -> `User` — **admin only**

`User.role` is exposed as the `UserRole` GraphQL enum (`ADMIN`, `EVENT_OWNER`,
`CUSTOMER`). The enum matters: with a bare `@Args('role') role: string` the
argument would be inferred as `String` and a client could send `"SUPERUSER"`,
silently widening the role vocabulary. Declaring the enum makes the server reject
it at validation time.

`register` deliberately has **no** role argument — every new account is a
`CUSTOMER`, so a client cannot register itself as an owner or an admin.

## Authorization

Role checks resolve against the **freshly validated** user from auth-backend,
never against the token contents and never against a role the client sent.
`me` returns `null` when there is no token so the app can render its logged-out
state rather than erroring.

Ordering is deliberate: identity first, then capability. A missing or invalid
token is `UNAUTHORIZED`; a valid token without the role is `FORBIDDEN`. Clients
can therefore tell "log in again" apart from "you may not do this".

The BFF check is **UX, not the security boundary**. Every admin operation also
re-verifies the caller's token in the backend, which is the actual enforcement
point. See the auth-backend README for why.

Unknown roles fail closed here too: a value this build does not recognise is
normalized to `CUSTOMER` before it reaches a resolver.