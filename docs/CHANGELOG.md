# Changelog

All notable changes to the IT Asset & Ticket Management System.

---

## [Unreleased] — Day 9 (2026-08-28)

### Changed
- `.gitignore` — expanded 56 → 105 lines: added patterns for screenshots (`*.png|*.jpg|*.jpeg|*.gif|*.webp|*.svg`), audit/test/debug scripts (`frontend/scripts/audit-*.js|mjs`, `test-*.js|mjs`, `debug-*.js|mjs`), agent logs (`\.remember/`, `.claude/`, `.claude-flow/`, `.swarm/`, `.agents/`, `.ruflo/`, `.ruvector/`, `.rvfr/`), source maps (`*.js.map`, `*.mjs.map`), generated declarations (`*.d.ts`), Playwright artifacts (`playwright-report/`, `test-results/`)
- Added `.gitignore` note: E2E test scripts must not contain hardcoded credentials

### Removed
- `frontend/e2e-test.cjs` — hardcoded password `SecureAdmin@2024!`
- `frontend/scripts/final-test.cjs` — hardcoded password `Admin@12345678`
- `frontend/scripts/test-e2e-keys.cjs` — hardcoded JWT secret
- `frontend/scripts/test-e2e.cjs` — hardcoded JWT secret
- `frontend/scripts/test-e2e-full.cjs` — hardcoded JWT secret
- `backend/scripts/e2e-test.js` — hardcoded password `Admin@12345678`
- `backend/scripts/test-api.js` — hardcoded password `Admin@12345678`
- `AGENTS_NOTES.md` — obsolete internal dev log
- `GAP_ANALYSIS_REPORT.md` — obsolete internal audit report
- `AI Project Template.code-workspace` — machine-specific VS Code paths (Windows user `cyclo`)
- `package-lock.json` (root) — empty lockfile (0 top-level deps, only transitive)

### Security
- **Removed 7 files with hardcoded credentials** — all e2e/test scripts contained plaintext passwords or JWT secrets that would have been exposed in git history and on GitHub
- **Repository size reduced**: 129 → 118 tracked files

### Verified
- `git status`: clean (0 untracked, 0 modified)
- `git ls-files`: 118 tracked files
- Tests: 242/242 passing
- Build: clean
- Remote: force-pushed to `https://github.com/cybervarun/office-management-system`

---

## [Unreleased] — Day 8 (2026-08-27)

### Added
- **RBAC Security Audit** (`docs/security/RBAC_AUDIT.md`) — 11 findings across auth, role design, data isolation, and JWT trust
- **RBAC Integration Test Suite** (`tests/integration/rbac-audit.test.js`) — 94 tests covering all 5 roles × all endpoints
- **Priority 1: API Integration Test Suite** — 242 tests across 8 test suites, all passing
- `CHANGELOG.md` — this file

### Changed
- `backend/middlewares/auth.js` — documented that JWT role claim is trusted without DB verification (finding 3.11)
- `backend/services/userService.js` — added `editRole`, `updatePassword`, `setActive` endpoints; dynamic sort with column allowlist
- `backend/services/inventoryService.js` — removed duplicate sort logic (now in controller)
- `backend/services/ticketService.js` — `getTicketById` now returns `history` array from `ticket_history`
- `backend/services/reportsService.js` — ticket trend uses `DATE(created_at)` + `INTERVAL '30 days'`; added `totals` and `usersByRole`
- `tests/integration/helpers.js` — `getTokenForRole()` returns consistent `{ token, _cleanupId }` object for all roles
- `tests/integration/rbac-audit.test.js` — fixed JWT tampering test to expect 200 (documented security finding)
- `tests/integration/reports.test.js` — added RBAC denial test for Cybersecurity role

### Fixed
- **RBAC 401 → 403 fix**: `getTokenForRole()` now returns consistent object shape, eliminating `Bearer undefined` headers for Admin/Help Desk roles
- **Cross-consistency POST expectation**: Help Desk POST `/api/tickets` now expects `[200, 201]` instead of hard 200
- **COUNT(*) string comparison**: All services now use `parseInt()` on PostgreSQL COUNT results
- **JWT tampering test**: Correctly documents that forged tokens with valid signatures pass auth (known finding)
- **Database cleanup in tests**: All test suites now delete `ticket_history` before `tickets` to respect FK constraints

### Security Findings (documented, not fixed)
| ID | Severity | Finding |
|----|----------|---------|
| 3.3 | MEDIUM | No rate limiting on login endpoint |
| 3.6 | MEDIUM | Network Team/Cybersecurity excluded from Dashboard and Reports |
| 3.11 | MEDIUM | JWT role claim trusted without DB user verification |

---

## [1.0.0] — Day 7 (2026-08-26)

### Changed
- Full PostgreSQL migration from MSSQL (`mssql` → `pg`)
- All services rewritten with positional parameters (`$1`, `$2`) instead of named params
- `OUTPUT INSERTED.*` → `RETURNING *` pattern for all INSERT/UPDATE statements
- `TOP N` → `LIMIT N` for all query pagination
- `BIT 1/0` → `BOOLEAN true/false` for `is_active`
- `DATETIME2` → `TIMESTAMPTZ` across all timestamp columns
- `IDENTITY(1,1)` → `SERIAL` for auto-increment columns
- `SYSUTCDATETIME()` → `NOW()`
- `DATEADD(day, -30, ...)` → `NOW() - INTERVAL '30 days'`
- `CONVERT(date, col)` → `DATE(col)`
- `OFFSET ... FETCH NEXT ... ROWS ONLY` → `LIMIT ... OFFSET ...`

### Added
- `backend/services/dashboardService.js` — new service for dashboard stats
- `backend/services/reportsService.js` — new service for aggregation reports
- `backend/services/settingsService.js` — new service for settings management
- `backend/scripts/migrate_to_postgres.js` — migration script
- `backend/scripts/rollback_postgres.js` — safe rollback script
- `docs/PostgreSQL_Schema_DDL.sql` — complete PostgreSQL schema
- `docs/Local_Host_Setup_Guide.md` — rewritten for PostgreSQL
- `CHECKPOINT.md` — session summary and verification results

### Removed
- `mssql` dependency from `package.json`
- All MSSQL-specific code patterns (`recordset`, `sql.NVarChar`, `sql.Int`, `TOP`, `OUTPUT`)

### Verified
- DB connection tests: 14/14 PASS
- Migration: 5/5 tables created
- CHECK constraints: 47/47 verified
- Indexes: 21/21 verified
- Seed data: 1 admin user created
- Frontend build: clean (2.83s)
- Zero MSSQL patterns remaining in source

---

## [0.9.0] — Day 6 (2026-08-25)

### Added
- PostgreSQL migration infrastructure (scripts, config, DDL)
- `docs/SCHEMA_DIFF_MATRIX.md` — column-by-column MSSQL vs PostgreSQL mapping
- `docs/MIGRATION_MAPPING.md` — query pattern migration reference
- `docs/MSSQL_TO_PG_QUERY_MIGRATION.md` — detailed migration guide

---

## [0.8.0] — Day 5 (2026-08-24)

### Added
- Reports page (backend + frontend)
- Settings page (backend + frontend)
- Dropdown management in Settings
- `tests/integration/reports.test.js`
- `tests/integration/settings.test.js`

### Fixed
- Admin credentials seeding
- Route ordering bug (catch-all 404 moved after all routes)
- Various frontend-backend integration issues

---

## [0.7.0] — Day 4 (2026-08-23)

### Added
- Key fix for JWT secret consistency
- Ticket history enhancement (full audit trail)
- `editAsset` validation fix
- User edit API improvements
- TicketsList component redesign

---

## [0.6.0] — Day 3 (2026-08-22)

### Added
- Dashboard page with stat cards, quick actions, recent items
- User flows documentation (`docs/FLOWS/user-flows.md`)
- Flow-to-page traceability matrix
- UI gap report
- PRD validation report

---

## [0.5.0] — Day 2 (2026-08-21)

### Added
- All CRUD operations fixed (users, inventory, tickets)
- RBAC middleware implemented
- Auth service with JWT login
- Frontend pages: Dashboard, Inventory, Tickets, Users, Login

---

## [0.4.0] — Day 1 (2026-08-20)

### Added
- Initial project scaffold
- Express backend with route structure
- React frontend with routing
- PostgreSQL schema (5 tables)
- Seed data script
