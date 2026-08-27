# Implementation & Refactoring Plan

**Version:** 1.0.0
**Date:** 2026-08-24

---

## Phase 1: Critical Security Fixes

### 1.1 Add Rate Limiting to Auth Endpoint
**File:** `backend/routes/authRoutes.js`, `backend/app.js`
**Priority:** High
**Why:** Brute-force protection on login.
**Change:** Add `express-rate-limit` middleware scoped to `/api/auth/login`.

### 1.2 Sanitize Error Responses
**File:** `backend/middlewares/errorHandler.js`
**Priority:** High
**Why:** Current handler leaks internal error messages to clients.
**Change:** Return only `error.message` for `ApiError`; return generic `"Internal Server Error"` for unknown errors. Log full stack server-side only.

### 1.3 Add Helmet for Security Headers
**File:** `backend/app.js`
**Priority:** Medium
**Why:** Currently manually sets 4 headers; Helmet covers 9+ with zero config drift.
**Change:** Replace manual header middleware with `helmet()`.

---

## Phase 2: Missing Features

### 2.1 Implement Reports Page
**Files:** `frontend/src/pages/Reports.jsx`, `backend/routes/reportsRoutes.js` (new), `backend/services/reportsService.js` (new)
**Priority:** Medium
**What:** Aggregate queries for:
- Assets by ministry/department count
- Tickets by status and team (last 30 days)
- Asset lifecycle alerts (end-of-life approaching)
- Export to PDF/Excel

### 2.2 Implement Settings Page
**Files:** `frontend/src/pages/Settings.jsx`, `backend/routes/settingsRoutes.js` (new)
**Priority:** Low
**What:** System config UI — change JWT expiry, toggle features, view audit logs.

### 2.3 Password Reset Flow
**Files:** `backend/routes/authRoutes.js`, `backend/services/authService.js`
**Priority:** High
**What:**
- `POST /api/auth/forgot-password` — generates token, stores in DB
- `POST /api/auth/reset-password` — validates token, updates password
- Email integration (sendgrid/SMTP) for token delivery

### 2.4 Email Notifications
**Files:** `backend/services/notificationService.js` (new)
**Priority:** Medium
**What:** Notify users when:
- Their ticket status changes
- A ticket is assigned to their team
- An asset linked to them is modified

---

## Phase 3: Data Quality & Usability

### 3.1 Soft Delete for Users and Assets
**Files:** `backend/services/userService.js`, `backend/services/inventoryService.js`
**Priority:** Medium
**What:** Add `deleted_at` DATETIME2 column; filter out deleted records from queries; add restore endpoint.

### 3.2 Asset Audit Trail
**Files:** `backend/services/inventoryService.js`, new `asset_history` table
**Priority:** Medium
**What:** Log every create/edit/delete on inventory same pattern as `ticket_history`.

### 3.3 Advanced Search
**Files:** `frontend/src/pages/InventoryManagement.jsx`, `frontend/src/pages/TicketsList.jsx`
**Priority:** Low
**What:** Multi-field search with date range pickers, advanced filter panel.

---

## Phase 4: Scalability

### 4.1 Connection Pool Tuning
**File:** `backend/.env`, `backend/config/db.js`
**Priority:** Low
**What:** Add pool monitoring; expose `/api/health` with DB pool stats.

### 4.2 Caching Layer
**Files:** `backend/services/inventoryService.js`, `backend/services/ticketService.js`
**Priority:** Low
**What:** Cache dropdown values and frequent list queries with Redis or in-memory TTL cache.

### 4.3 Background Jobs
**File:** `backend/scripts/` (new), cron or `node-cron`
**Priority:** Low
**What:** Daily jobs for:
- End-of-life asset alerts
- Inactive user cleanup
- Ticket history archival

---

## Phase 5: Testing & CI/CD

### 5.1 Add Test Framework
**Files:** `backend/package.json`, `backend/scripts/__tests__/` (already exists), `vitest.config.js`
**Priority:** High
**What:** Setup Vitest; write tests for:
- authService.login (bcrypt + JWT)
- inventoryService.addAsset (duplicate detection)
- ticketService.createTicket (audit log)
- RBAC middleware

### 5.2 GitHub Actions CI
**File:** `.github/workflows/ci.yml`
**Priority:** Medium
**What:**
- Lint on push
- Run tests on PR
- Build frontend on merge to main

### 5.3 API Contract Tests
**File:** `backend/scripts/postman_collection.json` (already exists)
**Priority:** Low
**What:** Convert to Newman CLI tests in CI pipeline.

---

## Technical Debt Summary

| Debt | File(s) | Severity | Effort |
|------|---------|----------|--------|
| No rate limiting on /login | authRoutes.js | High | 2h |
| Error details leaked to client | errorHandler.js | High | 1h |
| Manual security headers | app.js | Medium | 1h |
| No tests | — | High | 16h |
| Reports/Settings stub pages | Reports.jsx, Settings.jsx | Medium | 20h |
| No password reset flow | authService.js | High | 8h |
| No email notifications | — | Medium | 12h |
| No asset audit trail | inventoryService.js | Medium | 6h |
| Hardcoded roles/teams duplicated | constants.js + roles.js | Low | 2h |
| No soft delete | multiple services | Medium | 8h |

**Total estimated effort:** ~76 hours

---

## Recommended Priority Order

1. **Security** (rate limit, error sanitization) — 3h
2. **Core gaps** (password reset, tests) — 24h
3. **Features** (reports, notifications) — 32h
4. **Quality** (audit trail, soft delete) — 14h
5. **Scale** (caching, background jobs) — 10h
