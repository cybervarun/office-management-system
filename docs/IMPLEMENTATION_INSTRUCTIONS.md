# Implementation Instructions: IT Asset & Ticket Management System

## 1. Project Overview

This system replaces fragmented IT asset tracking and support workflows with a single, self-hosted web application. The platform is company-agnostic—any organization can deploy it within their own network with full configurability (custom fields, statuses, roles, teams). Government-grade security is enforced throughout.

**Target:** Small to large companies, all industries
**Deployment:** Self-hosted, single-tenant per company
**Timeline:** 14 weeks across 5 phases

Read `AGENTS.md` before starting any task. All feature work must reference the corresponding PRD in `docs/PRD/`.

---

## 2. Architecture

The system is a two-tier web application:

- **Frontend:** React 18 SPA (Vite 7) running on port 5173
- **Backend:** Node.js 18 + Express 4 REST API on port 5000
- **Database:** PostgreSQL 16 (migration from MSSQL in progress)

**Layering pattern:** routes → controllers → services → DB

Every request passes through: Security Headers → CORS → JSON Parse → Auth → RBAC → Validation → Controller.

See `docs/ARCHITECTURE.md` for the component diagram and invariants.

---

## 3. Database Implementation

### Step 1: Migrate from MSSQL to PostgreSQL

The existing schema uses `mssql` driver. Replace with `pg` package.

**Required changes:**

| MSSQL | PostgreSQL |
|-------|-----------|
| `INT IDENTITY(1,1)` | `SERIAL` |
| `NVARCHAR(n)` | `VARCHAR(n)` |
| `BIT` | `BOOLEAN` |
| `DATETIME2` | `TIMESTAMP` |
| `SYSUTCDATETIME()` | `NOW()` |
| `NEXT VALUE FOR seq` | `nextval('seq_name')` |
| `request.input()` | `pool.query(sql, params)` |

**Steps:**
1. Update `backend/config/db.js` to use `pg` connection pool
2. Rewrite `backend/scripts/apply_schema.js` for PostgreSQL DDL
3. Update all service files to use `pool.query(text, values)` parameterized syntax
4. Run schema migration: `npm run init-db`
5. Verify all constraints (UNIQUE on serial_number, mac_address, asset_id, email) are preserved

Reference: `docs/DATA_MODEL.md` — all 5 tables with constraints and indexes.

---

## 4. Feature Implementation Order

### Phase 1: Core Platform (Weeks 1–4)

#### Task 1.1: Authentication & Authorization
**Reference:** `docs/PRD/PRD-auth-users.md`, `docs/FLOWS/user-flows.md` (Login flow)

1. Update `backend/services/authService.js` to query by email OR username (PostgreSQL `OR` syntax)
2. Maintain existing JWT signing logic (payload: `{ id, email, role, name }`)
3. Verify `backend/middlewares/auth.js` rejects expired/missing tokens with 401
4. Verify `backend/middlewares/rbac.js` enforces role matrix from `backend/models/constants.js`
5. Frontend: Update `frontend/src/hooks/useAuth.js` and `frontend/src/services/api.js` — no changes needed (token handling is unchanged)

**Acceptance:** Login returns JWT in <1s. Inactive users get 403. All protected endpoints return 401 without token.

#### Task 1.2: User Management
**Reference:** `docs/PRD/PRD-auth-users.md`

1. `backend/services/userService.js` — implement CRUD with bcrypt hashing (10 rounds)
2. `backend/controllers/userController.js` — thin handler, delegate to service
3. `backend/routes/userRoutes.js` — protect with auth + RBAC(["Admin"])
4. Frontend `UsersManagement.jsx` — existing page structure; verify API calls match new endpoint responses

**Acceptance:** Admin can create/edit/deactivate users. User list paginated with search.

#### Task 1.3: Asset & Inventory Management
**Reference:** `docs/PRD/PRD-inventory.md`, `docs/FLOWS/user-flows.md` (Add Asset flow)

1. `backend/services/inventoryService.js` — rewrite queries for PostgreSQL; preserve Asset ID generation (SHA-256 first 8 chars of serial_number or mac_address)
2. Validate MAC format: `^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$`
3. Validate IP format: `^(?:\d{1,3}\.){3}\d{1,3}$`
4. Duplicate check: reject if serial_number or mac_address already exists
5. CSV import: parse with `express-fileupload` or `multer`, validate each row, batch insert
6. Pagination: use `OFFSET ... FETCH NEXT` syntax (PostgreSQL supports TSQL-style)

**Acceptance:** No duplicate serial/MAC. Asset ID auto-generated. CSV import/export works.

#### Task 1.4: Ticketing System
**Reference:** `docs/PRD/PRD-ticketing.md`, `docs/FLOWS/user-flows.md` (Raise Ticket, Resolve Ticket flows)

1. `backend/services/ticketService.js` — implement create, list, status update, work notes, team assignment
2. Status workflow: Open → In Progress → Pending → Resolved → Closed
3. Audit trail: every status change and note insert writes to `ticket_history` with `performed_by` and `created_at`
4. RBAC: teams see only their assigned tickets; Admin/Help Desk see all
5. Frontend `TicketsList.jsx`, `RaiseTicketForm.jsx` — verify API contract matches

**Acceptance:** Every status change logged immutably. Team isolation enforced.

---

### Phase 2: Customization & Search (Weeks 5–6)

#### Task 2.1: Dropdown & Lookup Management
**Reference:** `docs/PRD/PRD-settings.md`

1. `backend/services/settingsService.js` — CRUD for `lookup_values` table
2. `code` field auto-generated from `name` (slugify: lowercase, replace spaces with hyphens)
3. `GET /api/settings/dropdowns` returns grouped by `lookup_type`
4. Prevent deletion of lookup values still referenced by active records (or allow with warning)

#### Task 2.2: Advanced Search
**Reference:** `docs/FLOWS/user-flows.md` (Manage Users, Add Asset flows)

1. User search: filter by name, email, phone (PostgreSQL `ILIKE` with wildcards)
2. Asset search: filter by asset_user, email, phone, asset_id (same `ILIKE` pattern)
3. All search queries parameterized — no string concatenation

---

### Phase 3: Reporting & Dashboards (Weeks 7–8)

#### Task 3.1: Dashboard
**Reference:** `docs/PRD/PRD-reports.md`

1. `GET /api/dashboard/stats` — aggregate counts: total assets, open tickets, resolved today, tickets per team
2. `frontend/src/pages/Dashboard.jsx` — display summary cards; add chart components (recharts or chart.js)

#### Task 3.2: Reports
1. `GET /api/reports/assets` — group by category, status, location
2. `GET /api/reports/tickets` — open/resolved counts, avg resolution time, per team
3. `GET /api/reports/audit` — join ticket_history with users for full audit trail
4. Export: CSV via `res.download()`, PDF via `jspdf` or `react-to-print`

---

### Phase 4: Advanced Features (Weeks 9–12)

#### Task 4.1: Network Asset Discovery
1. Add `ping` and ARP scan capabilities using `network` or `netmask` npm packages
2. `POST /api/inventory/discover` accepts `{ ipRange: "192.168.1.0/24" }`
3. Map discovered devices to inventory fields (MAC → mac_address, hostname → asset_description)
4. Deduplicate against existing records before insert

#### Task 4.2: SLA Tracking
1. Add `sla_deadline` column to tickets (nullable, set at creation based on priority)
2. Add SLA badge in ticket list (green = on time, yellow = approaching, red = breached)
3. Configurable deadlines per priority: P1=4h, P2=24h, P3=72h (stored in lookup_values or settings)

#### Task 4.3: Email Notifications
1. Add `nodemailer` dependency
2. SMTP config via `.env`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
3. Trigger on: ticket created, assigned, status changed, resolved
4. Template: plain text or simple HTML with ticket details

---

### Phase 5: Hardening & Launch (Weeks 13–14)

#### Task 5.1: Security Audit
- Verify all SQL queries are parameterized (grep for string concatenation in SQL)
- Confirm JWT_SECRET is ≥32 characters in `.env`
- Test CORS: production mode restricts to `CORS_ORIGIN` list
- Verify security headers on all responses (already in `app.js`)

#### Task 5.2: Performance
- Profile API response times (target: p95 < 500ms)
- Add database indexes if query plans show sequential scans
- Compress frontend bundle (target: <500KB gzipped)

#### Task 5.3: Deployment
- Document `.env` template in `backend/.env.example`
- Create deployment script (`scripts/deploy.sh` or `deploy.ps1`)
- Write admin onboarding guide: seed admin account, configure dropdowns, invite users

---

## 5. Key Security Rules (Non-Negotiable)

1. **Never concatenate SQL strings.** Always use parameterized queries: `pool.query("SELECT * FROM users WHERE email = $1", [email])`
2. **Never log passwords, tokens, or PII.** Use generic IDs in logs.
3. **Never commit `.env` files.** Add to `.gitignore`.
4. **All write endpoints require validation.** Use `express-validator` chains.
5. **RBAC enforced at route level.** No business-logic bypass.

---

## 6. Summary & Next Steps

**Start with Phase 1, Task 1.1** (Authentication). This is the foundation—all other features depend on it.

**Before each task:**
1. Read the corresponding PRD in `docs/PRD/`
2. Review the user flow in `docs/FLOWS/user-flows.md`
3. Check `docs/DATA_MODEL.md` for schema details
4. Confirm the task is within scope (no hallucinated features)

**When complete:**
1. Run tests: `npm test` (backend), `npm run test:e2e` (frontend if applicable)
2. Verify build: `npm run build` (frontend), `node app.js` (backend smoke test)
3. Update this document with completion status

**Questions?** Refer to `docs/BRD.md` for business context and `docs/SRS.md` for technical deep-dives.
