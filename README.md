# Finance Intelligence Platform — Backend v1

Full-stack personal finance platform. This zip contains the **backend**
slice for the week 1-2 milestone: auth, accounts, transactions, categories.
Frontend comes next once this is running and tested against real requests.

## What's implemented

- **Auth** — register/login, BCrypt (strength 12) password hashing, JWT
  (7-day expiry, no refresh-token flow — deliberately simplified for a
  personal-use app; revisit if this ever has real security requirements
  beyond "don't lose my own data").
- **Accounts** — CRUD, soft-delete only (accounts are never hard-deleted
  because transactions reference them).
- **Categories** — shared default categories (seeded via migration) plus
  per-user custom categories.
- **Transactions** — CRUD with the two business rules called out in
  planning:
  1. Every account balance is a denormalized running total, kept in sync
     with the transaction that explains it, inside the same DB transaction.
  2. `TRANSFER` moves money between two of the user's own accounts and
     nets to zero — it is not income or expense (this matters once
     analytics/reporting is built: transfers must be excluded from those
     sums or your "total spending" number will be wrong).
- **Ownership enforcement** — every query is scoped by the authenticated
  user's id (read from the JWT via `CurrentUser`, never from a URL/body
  param). A request for `/api/accounts/{someone-elses-id}` returns 404,
  not the data. This is the rule from the original plan: *"a user must
  never access another user's data by changing an ID in the URL."*

## What's NOT in this slice (by design — see the 2-month plan)

Budgets, savings goals, recurring transactions, CSV import, reports/export,
notifications, audit logs, debts, investments, and the AI assistant are all
later milestones. Refresh-token rotation was cut for personal-use scope.

## Known gaps — intentional, not oversights

- `JwtAuthFilter` grants a flat `ROLE_USER` to everyone, ignoring the actual
  `role` column. Fine while there's no admin-only endpoint; fix before adding one.
- CORS is hardcoded to `localhost:5173`. Update `SecurityConfig` with your
  real deployed frontend origin before you deploy.
- `JWT_SECRET` has a dev-only default baked into `application.yml`. Do not
  deploy without overriding it via the `JWT_SECRET` env var.

## Running it locally

```bash
docker compose up --build
```

This starts Postgres and the backend together. API on `http://localhost:8080`.
Flyway runs migrations automatically on boot.

Swagger UI: `http://localhost:8080/swagger-ui.html`

### Without Docker

```bash
cd backend
export DB_URL=jdbc:postgresql://localhost:5432/finance_platform
export DB_USERNAME=finance_user
export DB_PASSWORD=finance_pass
export JWT_SECRET=$(openssl rand -base64 32)
./mvnw spring-boot:run
```

## Quick smoke test

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"changeme123","fullName":"Your Name"}'

TOKEN="<paste token from response>"

curl -X POST http://localhost:8080/api/accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"GTBank","type":"BANK","currency":"NGN","initialBalance":250000}'

curl http://localhost:8080/api/accounts -H "Authorization: Bearer $TOKEN"

# Create a second account, then a TRANSFER between them, then re-check both
# balances — this is the thing to verify before building anything on top.
```

## Tests

```bash
cd backend
./mvnw test
```

`AuthIntegrationTest` covers register/login (Testcontainers, real Postgres).
Account/transaction ownership tests are the next thing to add — write one
before building on top of this: assert user A cannot read/edit user B's
account or transaction.

## Next steps (in order)

1. Run this, hit the endpoints above, confirm the transfer balance logic
   behaves as expected.
2. Add integration tests for accounts + transactions, ownership checks especially.
3. Frontend: Vite + React + TS, wired to this API.
4. Dashboard + analytics endpoint (exclude TRANSFER from income/expense sums).
