# AGENTS.md

## Project Overview
IT Asset & Ticket Management System — self-hosted, single-tenant, fully customizable.
Target: small-to-large companies. Government-grade security. Free open-source stack.

## Stack
- **Frontend:** React 18 + Vite 7 + React Router 6 + Axios
- **Backend:** Node.js 18 + Express 4
- **Database:** PostgreSQL 16 (migration from MSSQL **COMPLETE**)
- **Auth:** JWT (8h expiry) + bcrypt 10 rounds
- **Validation:** express-validator

## Architecture Rules
- Every domain follows: routes → controllers → services → DB
- DB access always uses parameterized queries. Use the `executeQuery(text, values)` wrapper from `config/db.js` with `$1, $2` positional syntax. Never concatenate values into SQL strings.
- No raw SQL string concatenation anywhere (column names from hardcoded allowlists are acceptable)
- Controllers are thin — no business logic. If a controller needs a DB query, move it to a service.
- Services throw `ApiError` for all error cases
- Frontend uses `src/services/` (axios wrappers) + `src/hooks/useAuth.js`

## Key Invariants (Non-Negotiable)
These 6 invariants from `docs/ARCHITECTURE.md` must hold in all code:
1. **All writes go through services** — never query directly from controllers
2. **All queries are parameterized** — no string concatenation of values
3. **JWT required on every protected endpoint** — `auth` middleware on all non-login routes
4. **RBAC enforced at route level** — `allowRoles` middleware on every route that needs it
5. **Asset ID generated server-side** — first 8 lowercase hex chars of SHA-256(serial_number \|\| mac_address), no prefix
6. **Ticket history records every state change immutably** — every status change, assignment, transfer, note, and deletion logs to `ticket_history`

## Security (Hard Rules)
- NEVER hardcode secrets — use `.env` for all sensitive values
- ALL SQL must use parameterized queries (`$1/$2` positional syntax via `pg`). Never use string concatenation for values.
- Passwords stored with bcrypt at 10 rounds
- Security headers on every response: `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 0`
- CORS restricted to configured origins in production
- JWT secret must be ≥32 characters, stored in `.env` (validated at startup — fatal error if missing or too short)

## Code Conventions
- Named exports only
- Error responses: `{ error: "message" }` (never leak internals)
- Validation errors: `{ error: "Validation failed", details: [...] }`
- Pagination envelope: `{ data: [...], pagination: { page, pageSize, total, totalPages } }`
  - Services return `{ data, total }`; controllers wrap with `paginatedResponse()` before sending
- Asset ID = first 8 lowercase hex chars of SHA-256(serial_number \|\| mac_address) — no prefix
- At least one of serial_number or mac_address required for asset creation

## Commands
```bash
# Backend
cd backend && npm install
npm run dev          # nodemon hot reload
npm run init-db      # run schema migration
npm run seed-admin   # create initial admin account

# Frontend
cd frontend && npm install
npm run dev          # Vite dev server :5173
npm run build        # production build
```

## Environment Variables

### Backend (.env)
```
PORT=5000
JWT_SECRET=<32+ char random string>
JWT_EXPIRES_IN=8h
DB_HOST=localhost
DB_PORT=5432
DB_NAME=it_inventory
DB_USER=postgres
DB_PASSWORD=<your password>
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

> **Note:** Create `backend/.env.example` with all required variables and placeholder values.

## Do NOT
- Do not implement features not described in a PRD under `docs/PRD_*.md`
- Do not change DB schema without updating `docs/DATA_MODEL.md` and migrations
- Do not add new top-level folders without updating this file
- Do not log passwords, tokens, or PII
- Do not skip request validation on any endpoint (use `express-validator` or manual checks)
- Do not commit `.env` files or secrets

## Documentation Structure
- `docs/PRD_v2.md` — Master PRD (read before starting any feature)
- `docs/DATA_MODEL.md` — Database schema reference
- `docs/API_Documentation.md` — REST API endpoint spec
- `docs/SRS.md` — Software Requirements Specification
- `docs/BRD.md` — Business Requirements Document
- `docs/Project_Charter.md` — Project scope and charter
- `AGENTS_NOTES.md` — Ambiguity log from framework review
- `GAP_ANALYSIS_REPORT.md` — Backend audit gap log

## Key Files (quick reference)
| File | Purpose |
|------|---------|
| `backend/models/constants.js` | ROLES and TEAMS enums |
| `backend/utils/ApiError.js` | Custom error class |
| `backend/utils/asyncHandler.js` | Async wrapper for controllers |
| `backend/utils/pagination.js` | Pagination parser and envelope builder |
| `backend/middlewares/auth.js` | JWT verification |
| `backend/middlewares/rbac.js` | Role-based access control |
| `backend/middlewares/errorHandler.js` | Global error handler |
| `frontend/src/hooks/useAuth.js` | Auth state management |
| `frontend/src/services/api.js` | Axios instance with auth interceptor |
| `frontend/src/components/ProtectedRoute.jsx` | Route guard |

## Database (PostgreSQL)
- Driver: `pg` (node-postgres) v8+
- Connection: lazy-initialized Pool in `config/db.js`
- Query syntax: `$1, $2, ...` positional parameters
- Result access: `result.rows`, `result.rowCount`, `result.rows[0]`
- Transaction: `executeTransaction(fn)` wrapper in `config/db.js`
- Pagination: `LIMIT $pageSize OFFSET $offset` (separate count query for total)
- Date functions: `NOW()`, `DATE()`, `INTERVAL '30 days'`
- Boolean: native `true`/`false` (not `sql.Bit`)
- Identity: `SERIAL` or `BIGSERIAL`
- Unicode: `VARCHAR` (not `NVARCHAR`)
