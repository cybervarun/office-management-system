# PRD Review Notes: Reports & Settings

> **Review Date:** 2026-08-25
> **PRD Files:** `docs/PRD/PRD-reports.md`, `docs/PRD/PRD-settings.md`
> **Reviewer:** Agnes (Claude Code)

---

## Reports PRD Review

### Report Types Coverage

| Report Type | PRD Section | Defined? | DDL Supported? |
|-------------|-------------|----------|----------------|
| Dashboard summary cards | Section 4 | ✅ | ✅ (COUNT queries) |
| Asset overview (by category, status, location) | Section 2 | ⚠️ Partial | ✅ (GROUP BY available) |
| Ticket metrics (open/resolved, resolution time) | Section 2 | ⚠️ Partial | ⚠️ No resolution_time column |
| Audit trail report | Section 2 | ✅ | ✅ (ticket_history + lookup_values) |

### Export Formats

| Format | Specified? | Implementation Status |
|--------|-----------|----------------------|
| CSV | ✅ Section 2 + Section 5 | ✅ Endpoints defined |
| PDF | ✅ Section 2 ("using react-to-print or similar") | ⚠️ Frontend-only solution |

### Performance Requirements

| Requirement | Specified? | Adequate? |
|-------------|-----------|-----------|
| Reports load within 2s for <10k records | ✅ Section 6 | ✅ Measurable |
| Performance for large datasets (>10k) | ❌ Not specified | ⚠️ Gap |
| Pagination for large result sets | ❌ Not specified | ⚠️ Gap |

### Gaps in Reports PRD

**R1 — No Date Range Filter Specification (High)**
- Section 5 lists endpoints but no query parameters are documented
- Missing: `?from_date=...&to_date=...`, `?status=...`, `?team=...`
- The ticket metrics report needs date filtering for "resolved today" calculation
- **Impact:** Implementation cannot proceed without knowing filter parameters

**R2 — Ticket Metrics Report Missing Dimensions (Medium)**
- "Ticket metrics report (open/resolved, resolution time)" — but there is no `resolved_at` or `closed_at` column in the DDL
- Resolution time cannot be calculated without a timestamp for when a ticket reached Resolved status
- **Recommendation:** Add `resolved_at` and `closed_at` columns to the DDL, or remove "resolution time" from the report scope

**R3 — Asset Report Location Grouping Undefined (Medium)**
- "Asset overview report (by category, status, location)" — but "location" is ambiguous (PRD-inventory.md has `location` which doesn't exist in DDL)
- The DDL has `ministry`, `department`, `mdo_location`, `division`, `block_name`, `floor`, `room`
- **Recommendation:** Specify which location fields to use for grouping

**R4 — No Audit Report Schema Definition (Low)**
- "Audit trail report (who changed what, when)" — but no specification of what data the report returns
- Is it ticket_history only? Or also inventory changes and user changes?
- **Recommendation:** Define the report columns and data sources

**R5 — PDF Export Implementation Strategy Vague (Low)**
- "using react-to-print or similar" — this is a frontend solution that depends on browser print dialog
- No server-side PDF generation specified
- **Recommendation:** Decide between client-side (react-to-print) and server-side (pdfkit, puppeteer) and document the choice

---

## Settings PRD Review

### Lookup Value Management

| Aspect | Specified? | Status |
|--------|-----------|--------|
| CRUD operations | ✅ Section 5 (4 endpoints) | ✅ |
| Data model | ✅ Section 4 (lookup_values table) | ✅ |
| Admin-only access | ✅ Section 3 | ✅ |
| Slug auto-generation | ✅ Section 6 ("Code auto-generated from name") | ⚠️ Algorithm undefined |

### Gaps in Settings PRD

**S1 — Slug Generation Algorithm Not Defined (Medium)**
- "Code auto-generated from name (slugified)" — but no algorithm specified
- Examples: "IT Team" → "it-team" or "IT_TEAM" or "it_team"?
- Unicode handling? Special characters?
- **Recommendation:** Define the slugification function (e.g., lowercase, replace spaces with hyphens, remove special chars)

**S2 — Delete-in-Use Behavior Not Determined (High)**
- Section 6 says "Deleting a value in use shows warning (or prevents deletion)" — this is explicitly undecided
- This affects all lookup types (asset_category, ticket status, assigned_team, etc.)
- If a lookup value is deleted that is referenced by existing records, it could cause data integrity issues
- **Recommendation:** Decide and document: prevent deletion (CASCADE or RESTRICT) or allow with warning

**S3 — v2 Features Underspecified (Medium)**
- "Custom asset field management (v2)" — no details on how custom fields are stored or queried
- "Custom ticket status/workflow management (v2)" — conflicts with the fixed CHECK constraint in DDL
- "Company branding settings (v2)" — no spec at all
- **Recommendation:** Either provide v2 design or move these to a separate v2 PRD

**S4 — No Settings Audit Trail (Medium)**
- The PRD doesn't mention logging changes to lookup values
- The DDL doesn't have a settings_history table
- **Recommendation:** Add audit trail for settings changes or explicitly mark as v2

**S5 — Default Values for New Installations Not Specified (Low)**
- No mention of seed data for lookup_values
- The DDL has seed data for users but not for lookup values
- **Recommendation:** Add default lookup values to the seed script

---

## Cross-PRD Dependency Matrix

### Dependency Map

| Source PRD | Depends On | Dependency Type | Details |
|-----------|-----------|----------------|---------|
| PRD-reports | PRD-auth-users | Data access | Reports need user data for "who changed what" audit trails |
| PRD-reports | PRD-inventory | Data access | Asset overview report queries inventory table |
| PRD-reports | PRD-ticketing | Data access | Ticket metrics report queries tickets + ticket_history |
| PRD-settings | PRD-auth-users | RBAC alignment | Settings is Admin-only; must align with auth role definitions |
| PRD-ticketing | PRD-inventory | FK reference | tickets.inventory_id → inventory.id (optional link) |
| PRD-ticketing | PRD-auth-users | RBAC alignment | Ticket permissions depend on user roles from auth PRD |
| PRD-ticketing | PRD-settings | Lookup dependency | assigned_team values come from lookup_values |
| PRD-inventory | PRD-settings | Lookup dependency | asset_category, asset_current_status come from lookup_values |

### Cross-PRD Consistency Checks

| Check | Result | Details |
|-------|--------|---------|
| Auth roles match ticketing roles | ✅ Consistent | Both define Admin, Help Desk, IT Team, Network Team, Cybersecurity |
| Auth roles match inventory roles | ✅ Consistent | Both define Admin, Help Desk as read/write; others read-only |
| Ticket status values match DDL CHECK | ✅ Consistent | All 5 statuses match exactly |
| Ticket assigned_team values match DDL CHECK | ✅ Consistent | All 4 teams match exactly |
| Inventory field names match DDL | ⚠️ Partial | `location` field in PRD doesn't exist in DDL; `asset_category` length differs |
| Reports can access all data sources | ✅ Consistent | All report endpoints query tables that exist in DDL |
| Settings lookup_type values align with inventory/ticketing | ⚠️ Partial | Settings manages lookup_values but PRD doesn't list which types are used by other modules |

### Conflicts Found

| Conflict | PRDs Involved | Severity | Description |
|----------|--------------|----------|-------------|
| Asset ID generation algorithm | PRD-inventory vs DATA_MODEL | **Critical** | PRD hashes serial only; DDL+code hash serial\|\|mac |
| `location` field | PRD-inventory vs DDL | **High** | PRD references `location` column that doesn't exist |
| `asset_category` length | PRD-inventory vs DDL | **Medium** | PRD says VARCHAR(200); DDL says VARCHAR(100) |
| `asset_description` type | PRD-inventory vs DDL | **High** | PRD says VARCHAR(500) NOT NULL; DDL says TEXT NULL |
| Resolution time | PRD-reports vs DDL | **High** | PRD requires resolution time; no resolved_at timestamp in DDL |
| Delete-in-use behavior | PRD-settings | **Medium** | Explicitly undecided — warning vs prevent |
| Slug algorithm | PRD-settings | **Low** | "slugified" is ambiguous — no algorithm defined |

---

## Summary

### Reports PRD Gaps: 5
- 1 High (date range filters)
- 1 Medium (ticket metrics missing resolved_at)
- 1 Medium (location grouping ambiguous)
- 1 Low (audit report schema)
- 1 Low (PDF strategy vague)

### Settings PRD Gaps: 5
- 1 High (delete-in-use behavior undecided)
- 1 Medium (slug algorithm undefined)
- 1 Medium (v2 features underspecified)
- 1 Medium (no settings audit trail)
- 1 Low (no default seed data)

### Cross-PRD Dependencies: 8
- 5 data access dependencies
- 3 RBAC/lookup alignment dependencies

### Conflicts: 7
- 1 Critical (asset_id generation)
- 3 High (location field, description type, resolution time)
- 2 Medium (category length, delete-in-use)
- 1 Low (slug algorithm)
