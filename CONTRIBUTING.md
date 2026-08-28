# Contributing to IT Asset & Ticket Management System

Thank you for your interest in contributing. This document covers the development conventions, architecture patterns, and security rules you need to follow.

## Quick Links

- [README.md](./README.md) — Project overview, quick start, and scripts
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — Full system architecture
- [docs/DATA_MODEL.md](./docs/DATA_MODEL.md) — Database schema reference
- [docs/PostgreSQL_Schema_DDL.sql](./docs/PostgreSQL_Schema_DDL.sql) — Authoritative DDL
- [docs/API_Documentation.md](./docs/API_Documentation.md) — REST API reference
- [docs/security/RBAC_AUDIT.md](./docs/security/RBAC_AUDIT.md) — Security audit findings

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 · Vite 7 · React Router v7 · Axios |
| Backend | Node.js 18+ · Express 4 · `pg` (PostgreSQL driver) |
| Database | PostgreSQL 14+ |
| Auth | JWT (8h expiry) · bcryptjs v3 (10 rounds) |
| Testing | Jest · Supertest |
| Security | RBAC (5 roles) · Parameterized queries · Security headers |

---

## Architecture Pattern

Every domain follows a strict **4-layer pattern**:

```
Route → Controller → Service → Database
```

### Rules

1. **Controllers are thin** — extract input, call service, send response. No business logic.
2. **All writes go through services** — never query the database directly from controllers.
3. **All queries are parameterized** — use `$1, $2` positional syntax via `executeQuery(text, values)` from `config/db.js`. Never concatenate values into SQL strings.
4. **Services throw `ApiError`** for all error cases — never return raw errors.
5. **JWT required on every protected endpoint** — `auth` middleware on all non-login routes.
6. **RBAC enforced at route level** — `allowRoles` middleware on every route that needs it.

### Middleware Stack (order matters)

```
Request → Security Headers → CORS → express.json() → JWT Auth → RBAC → Validation → Controller
```

---

## Key Invariants (Non-Negotiable)

These 6 rules must hold in all code changes:

1. **All writes go through services** — never query directly from controllers
2. **All queries are parameterized** — no string concatenation of values
3. **JWT required on every protected endpoint** — `auth` middleware on all non-login routes
4. **RBAC enforced at route level** — `allowRoles` middleware on every route that needs it
5. **Asset ID generated server-side** — first 8 lowercase hex chars of `SHA-256(serial_number || mac_address)`, no prefix
6. **Ticket history records every state change immutably** — every status change, assignment, transfer, note, and deletion logs to `ticket_history`

---

## Code Conventions

### Exports & Imports

- Named exports only — no default exports
- Use `import { fn } from './module'` syntax

### Error Responses

```json
{ "error": "Human-readable message" }
```

Never leak internals (stack traces, SQL, variable names).

### Validation Errors

```json
{ "error": "Validation failed", "details": [{ "field": "email", "message": "Invalid email" }] }
```

### Pagination Envelope

Services return `{ data, total }`. Controllers wrap with `paginatedResponse()` before sending:

```json
{ "data": [...], "pagination": { "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 } }
```

### Asset ID Generation

```js
const crypto = require('crypto');
const assetId = crypto
  .createHash('sha256')
  .update(serialNumber + macAddress)
  .digest('hex')
  .substring(0, 8);
```

At least one of `serial_number` or `mac_address` is required for asset creation.

### Database Conventions

- Use `executeQuery(text, values)` from `config/db.js` for all queries
- Use `executeTransaction(fn)` for multi-statement operations
- Parse `COUNT(*)` results with `parseInt()` (PostgreSQL returns strings)
- Delete order: `ticket_history` before `tickets` (FK constraint)
- Use `TIMESTAMPTZ` for all timestamps (UTC-aware)
- Use native `BOOLEAN true/false` (not bit strings)
- Use `SERIAL` or `BIGSERIAL` for auto-increment

---

## Adding a New Feature

### 1. Check the PRD

Read `docs/PRD_v2.md` first (available locally). Do not implement features outside the PRD without product owner approval.

### 2. Backend Changes

```
1. Add route in backend/routes/
2. Add controller in backend/controllers/
3. Add service function in backend/services/
4. Add integration test in tests/integration/
5. Update docs/API_Documentation.md if endpoint is public
```

### 3. Frontend Changes

```
1. Add page component in frontend/src/pages/
2. Add API call in frontend/src/services/
3. Add route in frontend/src/App.jsx
4. Add E2E test in frontend/e2e/ (if applicable)
```

### 4. Database Changes

```
1. Update docs/PostgreSQL_Schema_DDL.sql
2. Update docs/DATA_MODEL.md
3. Do NOT change schema without updating both
```

---

## Security Rules (Hard)

- **NEVER hardcode secrets** — use `.env` for all sensitive values
- **ALL SQL must use parameterized queries** — `$1/$2` positional syntax via `pg`
- **Passwords stored with bcrypt at 10 rounds**
- **Security headers on every response**: HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff
- **JWT secret must be ≥32 characters**, stored in `.env`
- **Do not log passwords, tokens, or PII**
- **Do not skip request validation** on any endpoint
- **Do not commit `.env` files or secrets**

---

## Testing

```bash
# Run all tests (242 integration + 94 RBAC)
npm test

# Run integration tests sequentially (required for DB isolation)
npm run test:integration
```

### Test Conventions

- One test file per service/domain
- Use `helpers.js` for shared utilities (`getTokenForRole`, `request`)
- Clean up database state in `afterEach` or `afterAll`
- Delete `ticket_history` before `tickets` to respect FK constraints

---

## Database Migration

```bash
# Apply schema
cd backend && npm run migrate-pg

# Rollback (⚠️ deletes all data)
cd backend && npm run rollback-pg

# Test connectivity
cd backend && npm run test-db

# Create admin user
cd backend && npm run seed-admin
```

---

## Known Security Findings

See [docs/security/RBAC_AUDIT.md](./docs/security/RBAC_AUDIT.md) for the full audit. Open items:

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| 3.3 | MEDIUM | No rate limiting on `/api/auth/login` | Open |
| 3.6 | MEDIUM | Network Team/Cybersecurity excluded from Dashboard/Reports | Open |
| 3.11 | MEDIUM | JWT role claim trusted without DB user verification | Open |
| 3.8 | LOW | No 403 audit logging middleware | Open |

---

## Project Structure Quick Reference

| Directory | Purpose |
|-----------|---------|
| `backend/controllers/` | Thin request handlers |
| `backend/services/` | Business logic (all DB access lives here) |
| `backend/middlewares/` | auth.js, rbac.js, errorHandler.js |
| `backend/routes/` | Express routers per domain |
| `backend/config/db.js` | pg pool + executeQuery / executeTransaction |
| `backend/utils/` | ApiError, pagination, asyncHandler |
| `frontend/src/pages/` | One component per route |
| `frontend/src/services/` | Axios API wrappers |
| `frontend/src/hooks/` | useAuth for token management |
| `frontend/src/components/` | Shared UI components |
| `tests/integration/` | 8 test suites, 242 tests |
| `docs/` | Architecture, schema, API, security audit (core technical references) |
