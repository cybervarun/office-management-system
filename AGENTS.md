# AGENTS.md

## Project Overview
IT Asset & Ticket Management System — self-hosted, single-tenant, fully customizable.
Target: small-to-large companies. Government-grade security. Free open-source stack.

## Stack
- **Frontend:** React 18 + Vite 7 + React Router 6 + Axios
- **Backend:** Node.js 18 + Express 4
- **Database:** PostgreSQL 16 (migration from MSSQL in progress)
- **Auth:** JWT (8h expiry) + bcrypt 10 rounds
- **Validation:** express-validator

## Architecture Rules
- Every domain follows: routes → controllers → services → DB
- DB access always uses parameterized queries via `executeQuery(query, params)`
- No raw SQL string concatenation anywhere
- Controllers are thin — no business logic
- Services throw `ApiError` for all error cases
- Frontend uses `src/services/` (axios wrappers) + `src/hooks/useAuth.js`

## Security (Hard Rules)
- NEVER hardcode secrets — use `.env` for all sensitive values
- ALL SQL must use parameterized queries (`request.input()`)
- Passwords stored with bcrypt at 10 rounds
- Security headers on every response (HSTS, X-Frame-Options, nosniff, X-XSS-Protection)
- CORS restricted to configured origins in production
- JWT secret must be ≥32 characters, stored in `.env`

## Code Conventions
- Named exports only
- Error responses: `{ error: "message" }` (never leak internals)
- Validation errors: `{ error: "Validation failed", details: [...] }`
- Pagination envelope: `{ data: [...], pagination: { page, pageSize, total, totalPages } }`
- Asset ID = first 8 chars of SHA-256(serial_number || mac_address)
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

## Do NOT
- Do not implement features not described in a PRD under `docs/PRD_*.md`
- Do not change DB schema without updating `docs/DATA_MODEL.md` and migrations
- Do not add new top-level folders without updating this file
- Do not log passwords, tokens, or PII
- Do not use `any` in TypeScript or skip validation
- Do not commit `.env` files or secrets

## Documentation Structure
- `docs/PRD_v2.md` — Master PRD (read before starting any feature)
- `docs/DATA_MODEL.md` — Database schema reference
- `docs/API_Documentation.md` — REST API endpoint spec
- `docs/SRS.md` — Software Requirements Specification
- `docs/BRD.md` — Business Requirements Document
- `docs/Project_Charter.md` — Project scope and charter

## Key Files (quick reference)
| File | Purpose |
|------|---------|
| `backend/models/constants.js` | ROLES and TEAMS enums |
| `backend/utils/ApiError.js` | Custom error class |
| `backend/utils/asyncHandler.js` | Async wrapper for controllers |
| `backend/utils/pagination.js` | Pagination parser |
| `backend/middlewares/auth.js` | JWT verification |
| `backend/middlewares/rbac.js` | Role-based access control |
| `backend/middlewares/errorHandler.js` | Global error handler |
| `frontend/src/hooks/useAuth.js` | Auth state management |
| `frontend/src/services/api.js` | Axios instance with auth interceptor |
| `frontend/src/components/ProtectedRoute.jsx` | Route guard |

## Database Migration (MSSQL → PostgreSQL)
- Replace `mssql` with `pg` package
- Update `config/db.js` to use `pg` pool
- Convert SQL dialect (IDENTITY → SERIAL, NVARCHAR → VARCHAR, etc.)
- Update all service queries to use `pg` parameter syntax
- Keep same schema structure and constraints
