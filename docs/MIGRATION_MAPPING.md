# MSSQL → PostgreSQL Migration Mapping

> **Purpose:** Document all type mappings and constraint gaps identified in `SCHEMA_DIFF_MATRIX.md`, with resolution plan for the PostgreSQL DDL.

---

## 1. Type Mapping Table

| MSSQL Type | PostgreSQL Type | Notes |
|-----------|----------------|-------|
| `INT IDENTITY(1,1)` | `SERIAL` | Standard auto-increment; creates implicit sequence |
| `NVARCHAR(n)` | `VARCHAR(n)` | UTF-8 is default in PG; NVARCHAR adds no benefit |
| `NVARCHAR(MAX)` | `TEXT` | Unlimited length; no need to specify |
| `BIT` | `BOOLEAN` | Native PG boolean type |
| `DATETIME2` | `TIMESTAMPTZ` | UTC-aware timestamps; `NOW()` returns UTC |
| `DATE` | `DATE` | No change needed |
| `INT` (non-identity) | `INTEGER` | Direct mapping |
| `SEQ` (custom sequence) | `SEQUENCE` | Direct mapping; use `DEFAULT nextval('seq_name')` |

---

## 2. Constraint Gaps & Resolutions

### 2.1 Missing CHECK Constraints (3)

| Table | Column | MSSQL Constraint | Resolution |
|-------|--------|-----------------|------------|
| `users` | `role` | `CHECK (role IN ('Admin','Help Desk','IT Team','Network Team','Cybersecurity'))` | Add CHECK constraint in DDL |
| `tickets` | `status` | `CHECK (status IN ('Open','In Progress','Pending','Resolved','Closed'))` | Add CHECK constraint in DDL |
| `tickets` | `assigned_team` | `CHECK (assigned_team IN ('IT Help Desk','IT Team','Network Team','Cybersecurity Team'))` | Add CHECK constraint in DDL |

### 2.2 Missing UNIQUE Constraints (2)

| Table | Columns | MSSQL Constraint | Resolution |
|-------|---------|-----------------|------------|
| `lookup_values` | `(lookup_type, name)` | Partial unique index | Add `UNIQUE (lookup_type, name)` constraint |
| `lookup_values` | `(lookup_type, code)` | Partial unique index | Add `UNIQUE (lookup_type, code)` constraint |

### 2.3 Nullable/Not-Nullable Corrections

| Table | Column | MSSQL | Target (Fixed) | Rationale |
|-------|--------|-------|----------------|-----------|
| `inventory` | `asset_id` | NOT NULL | NOT NULL | Service requires it; 8-char hex format |
| `inventory` | `asset_description` | NULL | NULL | Service treats as optional; keep NULL |
| `inventory` | `asset_current_status` | NULL | NOT NULL | Service requires status; align with business rule |
| `lookup_values` | `code` | NOT NULL | NULL | Service allows NULL code when not generated |
| `lookup_values` | `updated_at` | present | **REMOVE** | Not in target model; no update logic in service |

### 2.4 Column Length Corrections

| Table | Column | MSSQL Length | Corrected PG Length | Rationale |
|-------|--------|-------------|---------------------|-----------|
| `inventory` | `asset_id` | 100 | 50 | 8-char hex + no prefix = well under 50 |
| `inventory` | `asset_user` | 255 | 200 | Align with service validation (max 200) |
| `inventory` | `asset_category` | 200 | 100 | Align with service validation (max 100) |

### 2.5 Missing Columns (22 — must be added to DDL)

These columns exist in the MSSQL schema and are actively used by the service layer but are absent from the current DATA_MODEL.md draft:

**inventory table (17 columns):**
`ministry`, `department`, `mdo_location`, `division`, `other_asset_category`, `block_name`, `floor`, `room`, `workstation`, `make_brand_model`, `purchase_date`, `operating_system`, `other_operating_system`, `network_connection_type`, `edr_installed`, `reason_no_edr`, `uem_installed`, `reason_no_uem`, `asset_custodian`, `date_of_removal`, `installation_date`, `end_of_support_date`, `end_of_life_date`, `amc_warranty`, `amc_warranty_expiry_date`, `critical`, `remarks`, `designation`, `email` (legacy), `phone` (legacy), `custodian` (legacy)

**Resolution:** All added to DDL with correct types and nullability based on MSSQL source and service usage.

### 2.6 Partial Unique Indexes (Nullable UNIQUE)

MSSQL supports filtered unique indexes (`WHERE col IS NOT NULL`). PostgreSQL equivalent:

```sql
-- Instead of UNIQUE constraint on nullable column, use partial unique index:
CREATE UNIQUE INDEX UX_inventory_serial ON inventory(serial_number) WHERE serial_number IS NOT NULL;
CREATE UNIQUE INDEX UX_inventory_mac    ON inventory(mac_address)    WHERE mac_address IS NOT NULL;
```

---

## 3. FK Relationship Map

| FK Name | Table | Column | References | Nullable |
|---------|-------|--------|------------|----------|
| `FK_tickets_users` | `tickets.created_by` | → `users.id` | No |
| `FK_tickets_inventory` | `tickets.inventory_id` | → `inventory.id` | Yes |
| `FK_ticket_history_ticket` | `ticket_history.ticket_id` | → `tickets.id` | No |
| `FK_ticket_history_user` | `ticket_history.performed_by` | → `users.id` | No |

---

## 4. Index Map

| Index Name | Table | Columns | Type | Purpose |
|-----------|-------|---------|------|---------|
| `UX_users_email` | `users` | `email` | UNIQUE | Login lookups |
| `IX_users_phone` | `users` | `phone` | B-Tree | Phone search |
| `UX_inventory_asset_id` | `inventory` | `asset_id` | UNIQUE | Asset ID lookups |
| `UX_inventory_serial` | `inventory` | `serial_number` | UNIQUE (partial) | Duplicate serial prevention |
| `UX_inventory_mac` | `inventory` | `mac_address` | UNIQUE (partial) | Duplicate MAC prevention |
| `IX_inventory_asset_user` | `inventory` | `asset_user` | B-Tree | User asset search |
| `IX_inventory_ministry` | `inventory` | `ministry` | B-Tree | Ministry filtering |
| `IX_inventory_status` | `inventory` | `asset_current_status` | B-Tree | Status filtering |
| `IX_tickets_status` | `tickets` | `status` | B-Tree | Status filtering |
| `IX_tickets_assigned_team` | `tickets` | `assigned_team` | B-Tree | Team filtering |
| `IX_tickets_created_by` | `tickets` | `created_by` | B-Tree | User ticket lookup |
| `IX_ticket_history_ticket` | `ticket_history` | `ticket_id` | B-Tree | History per ticket |
| `UX_lookup_type_name` | `lookup_values` | `(lookup_type, name)` | UNIQUE | Prevent duplicate dropdown entries |
| `UX_lookup_type_code` | `lookup_values` | `(lookup_type, code)` | UNIQUE | Prevent duplicate codes |
