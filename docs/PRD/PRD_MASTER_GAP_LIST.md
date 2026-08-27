# PRD Master Gap List

> **Review Date:** 2026-08-25
> **Scope:** All 5 PRDs reviewed against DDL, DATA_MODEL.md, ARCHITECTURE.md, and current implementation
> **Review Method:** Sequential block-by-block cross-reference

---

## Gap Summary

| Priority | Count | Gap IDs |
|----------|-------|---------|
| **Critical** | 1 | I1 |
| **High** | 7 | I2, T1, R1, S2, I3, A1, A2 |
| **Medium** | 10 | I4, I6, I7, I8, T2, T3, T4, R2, R3, S1, S3, S4 |
| **Low** | 8 | I5, I9, I10, T5, T6, T7, A3, A4, R4, R5, S5 |
| **Total** | **26** | |

---

## Critical (1)

### I1 — Asset ID Generation Algorithm Mismatch
- **Source:** PRD-inventory.md vs DATA_MODEL.md vs implementation
- **Description:** PRD specifies `SHA-256(serial_number)` — hashing only the serial number. The DDL and actual implementation hash `SHA-256(serial_number || mac_address)`.
- **Impact:** Existing assets will have different asset IDs than the PRD predicts. New asset imports will produce unexpected IDs.
- **Recommendation:** Resolve by choosing one approach and updating the other. If serial-only is chosen, update implementation. If serial||mac is chosen, update PRD Section 6.
- **Related:** DATA_MODEL.md Line 277-288

---

## High (7)

### A1 — Password Reset Endpoint Under-Specified
- **Source:** PRD-auth-users.md Section 4 & 2
- **Description:** `PATCH /api/users/:id/password` endpoint is listed but request body, response, and password complexity requirements are not defined. `create_admin.js` generates a SHA-256 fingerprint of a one-time password — this pattern is not reflected in the PRD.
- **Recommendation:** Define request/response schema and password complexity rules (min 12 chars, mixed case, number).
- **Related:** `backend/scripts/create_admin.js`

### A2 — Missing Token Refresh / Re-authentication Flow
- **Source:** PRD-auth-users.md Section 5
- **Description:** JWT expires in 8 hours with no refresh mechanism specified. Acceptable for government systems but must be explicitly stated as a design decision.
- **Recommendation:** Add explicit statement: "No token refresh — users re-login after 8h expiry."
- **Related:** ARCHITECTURE.md JWT Section

### I2 — `location` Field Does Not Exist in Schema
- **Source:** PRD-inventory.md Section 4 vs DDL
- **Description:** PRD lists `location: VARCHAR(255) NULL` but no such column exists in the DDL. Location data is split across `ministry`, `department`, `mdo_location`, `division`, `block_name`, `floor`, `room`, `workstation`.
- **Recommendation:** Update PRD to reference the actual location fields, or add a `location` column to the DDL.
- **Related:** PostgreSQL_Schema_DDL.sql

### I3 — `asset_description` Type/Nullability Mismatch
- **Source:** PRD-inventory.md Section 4 vs DDL
- **Description:** PRD says `VARCHAR(500) NOT NULL`; DDL says `TEXT NULL`. DDL allows NULL and unlimited length.
- **Recommendation:** Update PRD to match DDL (TEXT NULL) or add NOT NULL constraint to DDL.
- **Related:** PostgreSQL_Schema_DDL.sql Line 33

### I4 — No Request/Response Schemas for Any Inventory Endpoint
- **Source:** PRD-inventory.md Section 5
- **Description:** All 6 inventory endpoints (GET list, POST create, GET by ID, PUT update, POST import, GET export) lack request body and response shape definitions.
- **Recommendation:** Add JSON request/response examples for each endpoint.
- **Related:** 6 endpoints in `backend/routes/inventoryRoutes.js`

### T1 — Incomplete Status Transition Rules
- **Source:** PRD-ticketing.md Section 6
- **Description:** Only 3-4 of ~10 possible status transitions are specified. Missing: Open→Resolved, Open→Pending, In Progress→Closed, Pending→Open, Pending→Resolved, any→Closed.
- **Recommendation:** Add a complete transition matrix showing allowed transitions per role.
- **Related:** PostgreSQL_Schema_DDL.sql `chk_tickets_status` constraint

### R1 — No Date Range Filter Specification for Reports
- **Source:** PRD-reports.md Section 5
- **Description:** Report endpoints lack query parameter documentation. Missing: `?from_date=`, `?to_date=`, `?status=`, `?team=`.
- **Impact:** Implementation cannot proceed without knowing filter parameters.
- **Recommendation:** Document all query parameters for each report endpoint.
- **Related:** `backend/routes/reportsRoutes.js`

### S2 — Delete-in-Use Behavior Undecided
- **Source:** PRD-settings.md Section 6
- **Description:** PRD explicitly says "Deleting a value in use shows warning (or prevents deletion)" — the decision is deferred. This affects all lookup types and could cause data integrity issues.
- **Recommendation:** Decide and document: RESTRICT (prevent deletion if in use) or CASCADE (allow with warning).
- **Related:** `lookup_values` table, no FK constraint to inventory/tickets

---

## Medium (10)

### I5 — `asset_category` Length Mismatch
- **Source:** PRD-inventory.md Section 4 vs DDL
- **Description:** PRD says `VARCHAR(200)`; DDL says `VARCHAR(100)`. Route validation uses max:100.
- **Recommendation:** Update PRD to VARCHAR(100) to match DDL.

### I6 — "Configurable Fields" Undefined
- **Source:** PRD-inventory.md Section 2
- **Description:** "Asset CRUD with configurable fields" is listed but no specification of what fields are configurable and how.
- **Recommendation:** Link to lookup_values system (v2) or define which fields are configurable in v1.

### I7 — CSV Import/Export Schema Missing
- **Source:** PRD-inventory.md Section 2
- **Description:** CSV import and export are listed but no column definitions, delimiter specification, or error handling for malformed rows.
- **Recommendation:** Define CSV header row, column order, and error behavior.

### I8 — Asset Deletion Contradiction
- **Source:** PRD-inventory.md Section 2 vs DDL
- **Description:** Scope says "Asset deletion (immutable records)" is out of scope, but DDL has `ON DELETE CASCADE` on ticket_history, implying deletion is possible.
- **Recommendation:** Clarify — is asset deletion blocked at the API level, or just not implemented?

### T2 — No Priority Field in Data Model
- **Source:** PRD-ticketing.md Section 4 vs Section 2
- **Description:** PRD marks "Ticket priority auto-calculation" as v2/out of scope, but there is no v2 note in the data model section either.
- **Recommendation:** Add explicit v2 note: "Priority field to be added in v2 migration."

### T3 — No SLA Definition Despite v2 Mention
- **Source:** PRD-ticketing.md Section 2
- **Description:** "SLA tracking (v2)" is listed but no SLA fields, thresholds, or breach logic is defined.
- **Recommendation:** Define SLA columns (response_time, resolution_time) in a v2 migration plan.

### T4 — No Email Notification Specification
- **Source:** PRD-ticketing.md Section 2
- **Description:** "Email notifications (v2)" is listed but no notification events, templates, or delivery rules are defined.
- **Recommendation:** Define notification events and delivery method.

### R2 — Ticket Metrics Report Missing Dimensions
- **Source:** PRD-reports.md vs DDL
- **Description:** "Ticket metrics report (open/resolved, resolution time)" requires resolution time but no `resolved_at` or `closed_at` timestamp exists in the DDL.
- **Recommendation:** Add `resolved_at`/`closed_at` columns to the DDL, or remove "resolution time" from report scope.

### R3 — Asset Report Location Grouping Undefined
- **Source:** PRD-reports.md vs DDL
- **Description:** "Asset overview report (by category, status, location)" — "location" is ambiguous (PRD-inventory has `location` which doesn't exist in DDL).
- **Recommendation:** Specify which location fields to use for grouping (ministry, department, block_name, floor, room).

### S1 — Slug Generation Algorithm Not Defined
- **Source:** PRD-settings.md Section 6
- **Description:** "Code auto-generated from name (slugified)" — no algorithm specified. "IT Team" could become "it-team", "IT_TEAM", or "it_team".
- **Recommendation:** Define the slugification function (e.g., lowercase, replace spaces with hyphens, remove special chars).

### S3 — v2 Features Underspecified
- **Source:** PRD-settings.md Section 2
- **Description:** "Custom asset field management (v2)", "Custom ticket status/workflow management (v2)" — conflicts with fixed CHECK constraints in DDL. "Company branding settings (v2)" — no spec at all.
- **Recommendation:** Provide v2 design or move these to a separate v2 PRD.

### S4 — No Settings Audit Trail
- **Source:** PRD-settings.md
- **Description:** No mention of logging changes to lookup values. No settings_history table in DDL.
- **Recommendation:** Add audit trail for settings changes or explicitly mark as v2.

---

## Low (8)

### I9 — Search Criteria References Non-Existent Fields
- **Source:** PRD-inventory.md Section 7
- **Description:** "Search by user name, email, phone works" — `email` and `phone` are not columns on the inventory table (they exist on `users` table).
- **Recommendation:** Clarify whether search is on `asset_user` name field or the legacy email/phone columns.

### I10 — MAC/IP Validation Format Not Specified
- **Source:** PRD-inventory.md Section 7
- **Description:** "MAC format validated (XX:XX:XX:XX:XX:XX)" and "IP format validated (dotted quad)" — no regex or format specification given.
- **Recommendation:** Add explicit regex patterns or validator definitions.

### T5 — Missing "Reopened" Status in Workflow Diagram
- **Source:** PRD-ticketing.md Section 6
- **Description:** "Reopened" is shown as a label on the Resolved→In Progress arrow, but "Reopened" is not a valid status in the CHECK constraint.
- **Recommendation:** Clarify that "Reopened" is a transition label, not a status value.

### T6 — Work Notes Not Explicitly in Ticket History
- **Source:** PRD-ticketing.md Section 2
- **Description:** "Work notes with timestamp and author" is listed but the ticket_history table's `note` column serves double duty for both status changes and work notes.
- **Recommendation:** Clarify that work notes are stored in both `tickets.work_notes` and `ticket_history` (action='note').

### T7 — No Ticket Deletion Specification
- **Source:** PRD-ticketing.md Section 2 & 5
- **Description:** No DELETE endpoint listed. DDL has `ON DELETE CASCADE` on ticket_history, implying deletion is possible.
- **Recommendation:** Add a DELETE endpoint with role restriction (Admin only?).

### R4 — No Audit Report Schema Definition
- **Source:** PRD-reports.md
- **Description:** "Audit trail report (who changed what, when)" — no specification of what data the report returns or which tables it queries.
- **Recommendation:** Define the report columns and data sources (ticket_history only? user changes? lookup value changes?).

### R5 — PDF Export Implementation Strategy Vague
- **Source:** PRD-reports.md Section 2
- **Description:** "using react-to-print or similar" — frontend-only solution, no server-side PDF generation specified.
- **Recommendation:** Decide between client-side and server-side PDF and document the choice.

### S5 — Default Values for New Installations Not Specified
- **Source:** PRD-settings.md
- **Description:** No mention of seed data for lookup_values. DDL has seed data for users but not for lookup values.
- **Recommendation:** Add default lookup values (IT Team, Network Team, Cybersecurity Team, Open, In Progress, etc.) to the seed script.

---

## Cross-PRD Conflicts (7)

| # | Conflict | PRDs Involved | Severity | Resolution |
|---|----------|--------------|----------|------------|
| C1 | Asset ID generation algorithm | PRD-inventory vs DDL | **Critical** | Align implementation with PRD or update PRD |
| C2 | `location` field missing from DDL | PRD-inventory vs DDL | **High** | Add column or update PRD |
| C3 | `asset_description` type/nullability | PRD-inventory vs DDL | **High** | Align PRD with DDL or add constraint |
| C4 | Resolution time without timestamp | PRD-reports vs DDL | **High** | Add `resolved_at` column or remove from report |
| C5 | `asset_category` length mismatch | PRD-inventory vs DDL | **Medium** | Update PRD to VARCHAR(100) |
| C6 | Delete-in-use behavior undecided | PRD-settings | **Medium** | Decide RESTRICT vs CASCADE |
| C7 | Slug algorithm undefined | PRD-settings | **Low** | Define slugification function |

---

## Cross-PRD Dependencies (8)

| # | From | To | Type | Details |
|---|------|----|------|---------|
| D1 | PRD-reports | PRD-auth-users | Data access | Audit trail needs user data |
| D2 | PRD-reports | PRD-inventory | Data access | Asset overview queries inventory |
| D3 | PRD-reports | PRD-ticketing | Data access | Ticket metrics queries tickets + history |
| D4 | PRD-settings | PRD-auth-users | RBAC alignment | Settings is Admin-only |
| D5 | PRD-ticketing | PRD-inventory | FK reference | tickets.inventory_id → inventory.id |
| D6 | PRD-ticketing | PRD-auth-users | RBAC alignment | Ticket permissions depend on roles |
| D7 | PRD-ticketing | PRD-settings | Lookup dependency | assigned_team from lookup_values |
| D8 | PRD-inventory | PRD-settings | Lookup dependency | asset_category, status from lookup_values |

---

## Readiness Assessment

| Area | Status | Notes |
|------|--------|-------|
| Auth & Users | 🟡 Needs Clarification | Core logic solid; security gaps (G1-G4) need resolution |
| Inventory | 🔴 Needs Significant Work | API contracts missing; 3 schema mismatches; asset_id algorithm conflict |
| Ticketing | 🟢 Ready for v1 | Only transition matrix gap (G1) blocks full clarity |
| Reports | 🟡 Needs Clarification | Date filters and resolution time are blocking gaps |
| Settings | 🟡 Needs Clarification | Delete-in-use decision and slug algorithm are blockers |
| Cross-PRD Consistency | 🟡 Partial | 7 conflicts, 8 dependencies; roles and statuses consistent |

**Overall:** 3 of 5 PRDs are ready for implementation with minor fixes. 2 PRDs (Inventory, Reports/Settings) need significant clarification before development can proceed without rework.
