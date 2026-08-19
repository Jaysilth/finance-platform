# Finance Intelligence Platform — Frontend v1

Vite + React + TypeScript + Tailwind, wired directly to the live backend at
`https://finance-platform-hpms.onrender.com` (set in `.env`). Covers the
week 1-2 scope: login/register, accounts, transactions (including
transfers), and a dashboard computed from that data client-side — there's
no analytics endpoint yet, so totals are summed in `DashboardPage.tsx`
rather than fetched pre-aggregated.

## Before this will work end to end

**You must update the backend's CORS config and redeploy first**, or every
request from this frontend will be blocked by the browser regardless of
whether the frontend itself runs correctly. `SecurityConfig.java` in the
backend zip alongside this one has been rewritten to read allowed origins
from an env var instead of a hardcoded `localhost:5173`. Steps:

1. Replace `backend/src/main/java/com/financeplatform/common/config/SecurityConfig.java`
   in your repo with the version in this delivery.
2. Commit and push.
3. On Render, add an environment variable: `ALLOWED_ORIGINS` — for local
   dev testing set it to `http://localhost:5173`; once you deploy this
   frontend somewhere, add that URL too (comma-separated, no spaces
   around the comma — e.g. `https://your-frontend.vercel.app,http://localhost:5173`).
4. Redeploy the backend on Render (should auto-trigger on push, confirm
   in the Deploys tab).

Skipping this step is the single most likely cause of a confusing
"network error" that isn't actually a network error — check the browser
console for a CORS error message specifically before assuming anything
else is broken.

## Running locally

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`. `.env` already points at your live
Render backend, so you're testing against real deployed data from the
start — not a mock.

## What's implemented

- Login / register, JWT stored in `localStorage`, attached to every
  request via an axios interceptor. A 401 anywhere clears the token and
  redirects to `/login` — there's no refresh flow (matches the backend's
  7-day-expiry, no-refresh-token design).
- Accounts: list, create, soft-delete (with a confirm step).
- Transactions: list (paginated, 50/page), create — including transfers,
  with a from/to account picker — delete. Creating or deleting a
  transaction invalidates both the transactions *and* accounts query
  caches, since balances live on the account objects.
- Dashboard: total balance (only summed when every active account shares
  one currency — otherwise shows "Mixed currencies" rather than a wrong
  number), this month's income/expense, recent transactions. `TRANSFER`
  type is explicitly excluded from income/expense sums — see the comment
  in `DashboardPage.tsx` for why that matters.

## What's NOT here yet

Budgets, savings goals, recurring transactions, CSV import, reports, an
analytics endpoint (dashboard math is done client-side as a stand-in),
and the AI assistant. Matches the backend's current scope — build these
together, not frontend-ahead-of-backend.

## Known gaps

- No loading skeletons — just a plain "Loading…" text. Fine for personal
  use, worth revisiting before showing this to anyone else.
- No form validation library (react-hook-form/zod are in package.json but
  not wired up yet) — forms rely on native HTML `required`/`min` only.
  Add real validation before this handles money you actually care about
  getting wrong.
- Dashboard totals only look at the most recent 200 transactions (one
  page). Fine while your history is small; once it isn't, this needs a
  real backend analytics endpoint instead of client-side summing.

## Deploying the frontend

Any static host works (Vercel, Netlify, Render static site). Build with:

```bash
npm run build
```

Deploys the `dist/` folder. Set `VITE_API_URL` as an environment variable
on whichever platform you use — it's a build-time variable, so it needs
to be set before `npm run build` runs, not just in `.env` locally.
