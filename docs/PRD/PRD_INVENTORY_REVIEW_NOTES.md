# PRD Review Notes: Asset & Inventory Management

> **Review Date:** 2026-08-25
> **PRD File:** `docs/PRD/PRD-inventory.md`
> **Reviewer:** Agnes (Claude Code)

---

## Data Model Alignment Check

| PRD Field | DATA_MODEL.md Field | Match? | Notes |
|-----------|---------------------|--------|-------|
| `id: SERIAL PK` | `id: SERIAL PK` | ✅ Aligned | |
| `asset_id: VARCHAR(50) UNIQUE` | `asset_id: VARCHAR(50) NOT NULL, UNIQUE` | ✅ Aligned | |
| `serial_number: VARCHAR(200) UNIQUE NULL` | `serial_number: VARCHAR(200) NULL, UNIQUE (partial)` | ✅ Aligned | Partial unique index |
| `mac_address: VARCHAR(50) UNIQUE NULL` | `mac_address: VARCHAR(50) NULL, UNIQUE (partial)` | ✅ Aligned | Partial unique index |
| `asset_category: VARCHAR(200) NOT NULL` | `asset_category: VARCHAR(100) NOT NULL` | ⚠️ Mismatch | PRD says VARCHAR(200), DDL says VARCHAR(100). Route validation uses max:100. **DDL is authoritative.** |
| `asset_description: VARCHAR(500) NOT NULL` | `asset_description: TEXT NULL` | ❌ Mismatch | PRD says VARCHAR(500) NOT NULL; DDL says TEXT NULL. DDL allows NULL and unlimited length. |
| `asset_user: VARCHAR(200) NOT NULL` | `asset_user: VARCHAR(200) NOT NULL` | ✅ Aligned | |
| `asset_current_status: VARCHAR(100) NOT NULL` | `asset_current_status: VARCHAR(100) NOT NULL` | ✅ Aligned | |
| `ip_address: VARCHAR(50) NULL` | `ip_address: VARCHAR(50) NULL` | ✅ Aligned | |
| `location: VARCHAR(255) NULL` | ❌ MISSING | ❌ Mismatch | PRD has `location`; DDL does NOT. DDL has `ministry`, `department`, `mdo_location`, `division`, `block_name`, `floor`, `room`, `workstation` instead. |
| "additional lifecycle fields" | Many fields present | ✅ Aligned | PRD correctly uses ellipsis |

### Recovered Columns (22 from Day 2)
The PRD uses `... (additional lifecycle fields)` which correctly acknowledges the full schema. The following 22 recovered columns are NOT individually listed in the PRD but exist in the DDL:
- `sr_no`, `ministry`, `department`, `mdo_location`, `division`, `other_asset_category`, `block_name`, `floor`, `room`, `workstation`, `make_brand_model`, `purchase_date`, `operating_system`, `other_operating_system`, `network_connection_type`, `edr_installed`, `reason_no_edr`, `uem_installed`, `reason_no_uem`, `asset_custodian`, `date_of_removal`, `installation_date`, `end_of_support_date`, `end_of_life_date`, `amc_warranty`, `amc_warranty_expiry_date`, `critical`, `remarks`, `designation`, `email`, `phone`, `custodian`

**Assessment:** The PRD correctly abstracts these with `...`. No gap here — the summary ellipsis is appropriate.

---

## API Contract Completeness

| Endpoint | Request Schema | Response Schema | Status |
|----------|---------------|-----------------|--------|
| GET /api/inventory | ❌ Missing | ❌ Missing | Needs definition |
| POST /api/inventory | ❌ Missing | ❌ Missing | Needs definition |
| GET /api/inventory/:id | ❌ Missing | ❌ Missing | Needs definition |
| PUT /api/inventory/:id | ❌ Missing | ❌ Missing | Needs definition |
| POST /api/inventory/import | ❌ Missing | ❌ Missing | Needs definition |
| GET /api/inventory/export | ❌ Missing | ❌ Missing | Needs definition |

**All 6 endpoints lack request/response schemas.** This is a significant gap for implementation.

---

## Asset ID Generation Validation

| Aspect | PRD Specification | Implementation | Match? |
|--------|------------------|----------------|--------|
| Input for hash | `SHA-256(serial_number)` | `SHA-256(serial_number \|\| mac_address)` | ❌ MISMATCH |
| Output format | First 8 chars, lowercase hex | First 8 chars, lowercase hex | ✅ |
| When both provided | Serial takes precedence | Serial concatenated with MAC | ⚠️ Different |
| When neither provided | Not specified | Falls back to other fields | ⚠️ Not addressed |

**Critical mismatch:** The PRD shows `SHA-256("SN12345678")` — hashing only the serial number. The data model and implementation use `SHA-256(serial_number || mac_address)`. This is a **design decision discrepancy** that must be resolved.

---

## Gaps Identified

### G1 — Asset ID Generation Algorithm Mismatch (Critical)
**Location:** Section 6 (Asset ID Generation)
**Issue:** PRD says hash only `serial_number`; DATA_MODEL.md and implementation hash `serial_number || mac_address`.
**Resolution needed:** Decide which is correct:
- Option A: Hash only serial (simpler, but collisions if same serial + different MAC)
- Option B: Hash serial || mac (current implementation, more unique)
- Option C: Hash serial || mac || asset_id input (if asset_id is provided, use it directly)
**Current behavior in code:** `generateAssetId(serial, mac)` concatenates both. If only serial is provided, MAC defaults to empty string.

### G2 — `location` Field Does Not Exist in Schema (High)
**Location:** Section 4 (Data Model)
**Issue:** PRD lists `location: VARCHAR(255) NULL` but this column does not exist in the DDL. The actual location data is spread across `ministry`, `department`, `mdo_location`, `division`, `block_name`, `floor`, `room`, `workstation`.
**Resolution:** Either add `location` column to DDL, or update PRD to reference the actual location fields.

### G3 — asset_description Type/Nullability Mismatch (High)
**Location:** Section 4 (Data Model)
**Issue:** PRD says `VARCHAR(500) NOT NULL`; DDL says `TEXT NULL`.
**Resolution:** Update PRD to match DDL (TEXT NULL) or add NOT NULL constraint to DDL.

### G4 — asset_category Length Mismatch (Medium)
**Location:** Section 4 (Data Model)
**Issue:** PRD says `VARCHAR(200)`; DDL says `VARCHAR(100)`.
**Resolution:** Update PRD to VARCHAR(100) to match DDL.

### G5 — No Request/Response Schemas for Any Endpoint (High)
**Location:** Section 5 (API Endpoints)
**Issue:** All 6 endpoints lack request body and response shape definitions.
**Impact:** Developers must infer schemas from implementation, leading to inconsistencies.
**Recommendation:** Add JSON request/response examples for each endpoint.

### G6 — "Configurable Fields" Undefined (Medium)
**Location:** Section 2 (Scope)
**Issue:** "Asset CRUD with configurable fields" is listed but no specification of what fields are configurable and how.
**Recommendation:** Either link to the lookup_values system (v2) or define which fields are configurable in v1.

### G7 — CSV Import/Export Schema Missing (Medium)
**Location:** Section 2 (Scope)
**Issue:** CSV import and export are listed but no column definitions, delimiter specification, or error handling for malformed rows.
**Recommendation:** Define CSV header row, column order, and error behavior (skip bad rows? abort entire import?).

### G8 — Asset Deletion Contradiction (Medium)
**Location:** Section 2 (Scope), Section 5 (API Endpoints)
**Issue:** Scope says "Asset deletion (immutable records)" is out of scope, but no DELETE endpoint is listed in the API section. However, the DDL has `ON DELETE CASCADE` on ticket_history, implying assets CAN be deleted (tickets just lose their reference).
**Resolution:** Clarify — is asset deletion truly blocked at the API level, or just not implemented?

### G9 — Search Criteria References Non-Existent Fields (Low)
**Location:** Section 7 (Acceptance Criteria)
**Issue:** "Search by user name, email, phone works" — but `email` and `phone` are not columns on the inventory table (they exist on the `users` table). The inventory table has `asset_user` (name) and legacy `email`/`phone` columns which are nullable.
**Resolution:** Clarify whether search is on `asset_user` name field or the legacy email/phone columns.

### G10 — MAC/IP Validation Format Not Specified (Low)
**Location:** Section 7 (Acceptance Criteria)
**Issue:** "MAC format validated (XX:XX:XX:XX:XX:XX)" and "IP format validated (dotted quad)" — but no regex or format specification is given.
**Recommendation:** Add explicit regex patterns or validator definitions.

---

## Summary

- **Data model alignment:** 3 mismatches (asset_id generation, location field, asset_description type), rest aligned
- **API contracts:** 0/6 endpoints have request/response schemas — major gap
- **Critical gap:** Asset ID generation algorithm differs between PRD and implementation
- **High-priority gaps:** 4 (asset_id mismatch, location field, description type, missing schemas)
- **Total gaps:** 10 (1 Critical, 4 High, 3 Medium, 2 Low)
- **Overall assessment:** PRD needs significant API contract detail before implementation can proceed consistently
