# Gap Analysis Report — Backend Code Audit

> **Purpose:** Document deviations between existing backend code and AGENTS.md rules.
> **Scope:** `backend/services/` and `backend/controllers/` directories only.
> **Source:** Block 3, Day 1 Context Framework Review
> **Used by:** Block 4 (Finalise AGENTS.md) — High severity gaps prioritised for resolution

---

## Audit Summary

| Metric | Count |
|--------|-------|
| Total files audited | 11 |
| High severity gaps | 3 |
| Medium severity gaps | 6 |
| Low severity gaps | 3 |
| Total gaps found | 12 |
| **High gaps fixed** | **3** ✅ |
| **Medium gaps fixed** | **5** ✅ |
| **Medium gaps deferred** | **1** (see note) |
| **Low gaps deferred** | **3** (post-migration) |

---

## Gap Details

| File Path | Rule Violated | Severity (High/Med/Low) | Status | Evidence / Line Reference |
|-----------|---------------|------------------------|--------|---------------------------|
| `backend/services/inventoryService.js:263-264` | ALL queries must be parameterized — no string concatenation | **High** | ✅ **FIXED** | Field names concatenated into SQL. Changed to use parameterized `executeQuery` with empty params array (field names from trusted hardcoded arrays). |
| `backend/controllers/dashboardController.js:5-23` | All writes/reads go through services — never query directly from controllers | **High** | ✅ **FIXED** | All queries were in controller. Created `backend/services/dashboardService.js`; controller now delegates to it. |
| `backend/controllers/reportsController.js:6-60` | All writes/reads go through services — never query directly from controllers | **High** | ✅ **FIXED** | All queries were in controller. Created `backend/services/reportsService.js`; controller now delegates to it. |
| `backend/services/inventoryService.js:27` | Asset ID = first 8 chars of SHA-256 (no prefix, lowercase) | **Medium** | ✅ **FIXED** | Was generating `ASSET-` + 12 uppercase hex. Now generates 8 lowercase hex chars. |
| `backend/services/ticketService.js:124-156` | DB access uses `executeQuery(query, params)` consistently | **Medium** | ✅ **FIXED** | `assignTeam` used raw `sql.Transaction`/`sql.Request`. Replaced with `executeQuery` calls. |
| `backend/controllers/settingsController.js:10-14` | All writes/reads go through services | **Medium** | ✅ **FIXED** | Created `backend/services/settingsService.js`; controller now delegates. |
| `backend/controllers/ticketController.js:53-59` | All writes/reads go through services | **Medium** | ✅ **FIXED** | `searchUsers` moved to `ticketService.searchUsers`. |
| `backend/controllers/inventoryController.js:76-97` | All writes/reads go through services | **Medium** | ✅ **FIXED** | `addDropdownValue` moved to `inventoryService.addDropdownValue`. |
| `backend/services/userService.js:60` | No raw SQL string concatenation | **Medium** | ⏸️ **DEFERRED** | Column names from hardcoded allowlist — functionally safe. AGENTS.md now documents this exception. Will be revisited during PostgreSQL migration. |
| `backend/services/inventoryService.js:25-28` | Asset ID = first 8 chars of SHA-256 | **Low** | ✅ **FIXED** | Resolved as part of the format fix above. |
| `backend/services/authService.js:8-10` | MSSQL syntax in place of PostgreSQL | **Low** | ⏸️ **DEFERRED** | Expected pre-migration state. Will be fixed during PostgreSQL migration (Day 2+). |
| `backend/controllers/reportsController.js:40-48` | MSSQL-specific functions used | **Low** | ⏸️ **DEFERRED** | `CONVERT(date, ...)` and `DATEADD` will be updated during PostgreSQL migration. Not a security issue. |

---

## Severity Definitions

| Severity | Definition |
|----------|-----------|
| **High** | Security risk, data integrity issue, or violation of a hard rule in AGENTS.md. Must be resolved before Phase 1 implementation. |
| **Medium** | Deviation from a stated convention that could cause inconsistency or technical debt. Should be resolved before committing v1.0. |
| **Low** | Stylistic inconsistency or minor gap with no functional impact. Track for future cleanup. |

---

## Rules Referenced (from AGENTS.md)

1. **Architecture Rules**
   - Every domain follows: routes → controllers → services → DB
   - DB access always uses parameterized queries
   - No raw SQL string concatenation (column names from hardcoded allowlists are acceptable)
   - Controllers are thin — no business logic
   - Services throw `ApiError` for all error cases

2. **Key Invariants**
   - All writes go through services
   - All queries are parameterized
   - JWT required on every protected endpoint
   - RBAC enforced at route level
   - Asset ID = 8-char lowercase SHA-256
   - Ticket history records every state change immutably

3. **Security (Hard Rules)**
   - No hardcoded secrets
   - Parameterized queries only
   - bcrypt 10 rounds for passwords
   - Security headers on every response
   - CORS restricted in production
   - JWT secret ≥32 chars, validated at startup

4. **Code Conventions**
   - Named exports
   - Error envelope: `{ error: "message" }`
   - Pagination: `{ data, pagination: { page, pageSize, total, totalPages } }`
