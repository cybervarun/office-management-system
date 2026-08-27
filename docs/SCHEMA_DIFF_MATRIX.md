# Schema Diff Matrix — MSSQL vs Target PostgreSQL

> **Purpose:** Cross-reference existing MSSQL schema (`docs/Database_Schema.md`, `backend/scripts/schema.sql`) against the target PostgreSQL data model (`docs/DATA_MODEL.md`).

---

## Methodology

| Source | Content |
|--------|---------|
| MSSQL DDL | `backend/scripts/schema.sql` |
| MSSQL Documentation | `docs/Database_Schema.md` |
| Target Model | `docs/DATA_MODEL.md` (current draft) |
| Active Service Code | `backend/services/*.js` (runtime behavior) |

---

## Table: `users`

| Column | MSSQL Type | Target PG Type | Delta |
|--------|-----------|----------------|-------|
| `id` | `INT IDENTITY(1,1)` PK | `SERIAL` PK | ✅ Aligned (SERIAL = auto-increment) |
| `name` | `NVARCHAR(255) NOT NULL` | `VARCHAR(255) NOT NULL` | ✅ Type mapping correct |
| `email` | `NVARCHAR(255) NOT NULL UNIQUE` | `VARCHAR(255) NOT NULL UNIQUE` | ✅ Aligned |
| `phone` | `NVARCHAR(30) NULL` | `VARCHAR(30) NULL` | ✅ Aligned |
| `role` | `NVARCHAR(50) NOT NULL CHECK IN (...)` | `VARCHAR(50) NOT NULL` | ⚠️ **MISSING CHECK constraint** in target |
| `password_hash` | `NVARCHAR(255) NOT NULL` | `VARCHAR(255) NOT NULL` | ✅ Aligned |
| `is_active` | `BIT NOT NULL DEFAULT 1` | `BOOLEAN NOT NULL DEFAULT true` | ✅ Type mapping correct |
| `created_at` | `DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()` | `TIMESTAMP NOT NULL DEFAULT NOW()` | ⚠️ MSSQL: UTC; PG: local — use `TIMESTAMPTZ` + `NOW()` for correctness |
| `updated_at` | `DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()` | `TIMESTAMP NOT NULL DEFAULT NOW()` | ⚠️ Same as above |

**MSSQL-only items not in target:**
- `CHECK (role IN ('Admin','Help Desk','IT Team','Network Team','Cybersecurity'))` on `role`

**Target-only items not in MSSQL:**
- None

---

## Table: `inventory`

| Column | MSSQL Type | Target PG Type | Delta |
|--------|-----------|----------------|-------|
| `id` | `INT IDENTITY(1,1)` PK | `SERIAL` PK | ✅ Aligned |
| `sr_no` | `INT NOT NULL DEFAULT nextval(seq)` | `INTEGER NOT NULL DEFAULT nextval(...)` | ✅ Aligned |
| `ministry` | `NVARCHAR(200) NOT NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `department` | `NVARCHAR(200) NOT NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `mdo_location` | `NVARCHAR(200) NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `division` | `NVARCHAR(200) NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `asset_id` | `NVARCHAR(100) NOT NULL, UNIQUE` | `VARCHAR(50) UNIQUE` | ⚠️ **Length mismatch** (100→50), **NULLABILITY mismatch** (NOT NULL→nullable in doc) |
| `serial_number` | `NVARCHAR(200) NULL, UNIQUE partial` | `VARCHAR(200) UNIQUE NULL` | ✅ Aligned (partial unique handled via index) |
| `other_asset_category` | `NVARCHAR(200) NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `asset_category` | `NVARCHAR(200) NOT NULL` | `VARCHAR(200) NOT NULL` | ✅ Aligned |
| `block_name` | `NVARCHAR(200) NOT NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `floor` | `NVARCHAR(100) NOT NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `room` | `NVARCHAR(100) NOT NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `workstation` | `NVARCHAR(100) NOT NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `asset_description` | `NVARCHAR(MAX) NULL` | `VARCHAR(500) NOT NULL` | ⚠️ **NULLABLE→NOT NULL**, **MAX→500** — conflicts with service code |
| `make_brand_model` | `NVARCHAR(300) NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `purchase_date` | `DATE NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `operating_system` | `NVARCHAR(100) NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `other_operating_system` | `NVARCHAR(100) NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `ip_address` | `NVARCHAR(50) NULL` | `VARCHAR(50) NULL` | ✅ Aligned |
| `mac_address` | `NVARCHAR(50) NULL, UNIQUE partial` | `VARCHAR(50) UNIQUE NULL` | ✅ Aligned |
| `network_connection_type` | `NVARCHAR(100) NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `edr_installed` | `NVARCHAR(10) NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `reason_no_edr` | `NVARCHAR(MAX) NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `uem_installed` | `NVARCHAR(10) NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `reason_no_uem` | `NVARCHAR(MAX) NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `asset_user` | `NVARCHAR(255) NOT NULL` | `VARCHAR(200) NOT NULL` | ⚠️ **Length mismatch** (255→200) |
| `asset_custodian` | `NVARCHAR(255) NOT NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `asset_current_status` | `NVARCHAR(100) NULL` | `VARCHAR(100) NOT NULL` | ⚠️ **NULLABLE→NOT NULL** — service treats it as required |
| `date_of_removal` | `DATE NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `installation_date` | `DATE NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `end_of_support_date` | `DATE NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `end_of_life_date` | `DATE NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `amc_warranty` | `NVARCHAR(10) NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `amc_warranty_expiry_date` | `DATE NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `critical` | `NVARCHAR(10) NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `remarks` | `NVARCHAR(MAX) NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `designation` | `NVARCHAR(200) NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** |
| `email` | `NVARCHAR(255) NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** (legacy) |
| `phone` | `NVARCHAR(30) NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** (legacy) |
| `custodian` | `NVARCHAR(255) NULL` | *(absent in DATA_MODEL.md)* | ⚠️ **MISSING from target document** (legacy) |
| `created_at` | `DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()` | `TIMESTAMP NOT NULL DEFAULT NOW()` | ⚠️ Use TIMESTAMPTZ for UTC consistency |
| `updated_at` | `DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()` | `TIMESTAMP NOT NULL DEFAULT NOW()` | ⚠️ Same |

---

## Table: `tickets`

| Column | MSSQL Type | Target PG Type | Delta |
|--------|-----------|----------------|-------|
| `id` | `INT IDENTITY(1,1)` PK | `SERIAL` PK | ✅ Aligned |
| `title` | `NVARCHAR(255) NOT NULL` | `VARCHAR(255) NOT NULL` | ✅ Aligned |
| `description` | `NVARCHAR(MAX) NOT NULL` | `TEXT NOT NULL` | ✅ Aligned (TEXT = infinite in PG) |
| `status` | `NVARCHAR(50) NOT NULL CHECK IN (...)` | `VARCHAR(50) NOT NULL DEFAULT 'Open'` | ⚠️ **MISSING CHECK constraint** in target |
| `created_by` | `INT NOT NULL FK → users(id)` | `INTEGER NOT NULL FK → users(id)` | ✅ Aligned |
| `assigned_team` | `NVARCHAR(100) NOT NULL CHECK IN (...)` | `VARCHAR(100) NOT NULL DEFAULT 'IT Help Desk'` | ⚠️ **MISSING CHECK constraint** in target |
| `inventory_id` | `INT NULL FK → inventory(id)` | `INTEGER NULL FK → inventory(id)` | ✅ Aligned |
| `work_notes` | `NVARCHAR(MAX) NULL` | `TEXT NULL` | ✅ Aligned |
| `created_at` | `DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()` | `TIMESTAMP NOT NULL DEFAULT NOW()` | ⚠️ Use TIMESTAMPTZ |
| `updated_at` | `DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()` | `TIMESTAMP NOT NULL DEFAULT NOW()` | ⚠️ Use TIMESTAMPTZ |

**MSSQL-only items not in target:**
- `CHECK (status IN ('Open','In Progress','Pending','Resolved','Closed'))`
- `CHECK (assigned_team IN ('IT Help Desk','IT Team','Network Team','Cybersecurity Team'))`

---

## Table: `ticket_history`

| Column | MSSQL Type | Target PG Type | Delta |
|--------|-----------|----------------|-------|
| `id` | `INT IDENTITY(1,1)` PK | `SERIAL` PK | ✅ Aligned |
| `ticket_id` | `INT NOT NULL FK → tickets(id)` | `INTEGER NOT NULL FK → tickets(id)` | ✅ Aligned |
| `action` | `NVARCHAR(100) NOT NULL` | `VARCHAR(100) NOT NULL` | ✅ Aligned |
| `from_team` | `NVARCHAR(100) NULL` | `VARCHAR(100) NULL` | ✅ Aligned |
| `to_team` | `NVARCHAR(100) NULL` | `VARCHAR(100) NULL` | ✅ Aligned |
| `note` | `NVARCHAR(500) NULL` | `VARCHAR(500) NULL` | ✅ Aligned |
| `performed_by` | `INT NOT NULL FK → users(id)` | `INTEGER NOT NULL FK → users(id)` | ✅ Aligned |
| `created_at` | `DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()` | `TIMESTAMP NOT NULL DEFAULT NOW()` | ⚠️ Use TIMESTAMPTZ |

---

## Table: `lookup_values`

| Column | MSSQL Type | Target PG Type | Delta |
|--------|-----------|----------------|-------|
| `id` | `INT IDENTITY(1,1)` PK | `SERIAL` PK | ✅ Aligned |
| `lookup_type` | `NVARCHAR(100) NOT NULL` | `VARCHAR(100) NOT NULL` | ✅ Aligned |
| `name` | `NVARCHAR(255) NOT NULL` | `VARCHAR(255) NOT NULL` | ✅ Aligned |
| `code` | `NVARCHAR(100) NOT NULL` | `VARCHAR(100) NULL` | ⚠️ **NULLABLE→NOT NULL** — service uses NULL default |
| `created_at` | `DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()` | `TIMESTAMP NOT NULL DEFAULT NOW()` | ⚠️ Use TIMESTAMPTZ |
| `updated_at` | `DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()` | *(absent in target)* | ⚠️ MSSQL has `updated_at`; target omits it |

**MSSQL-only constraints not in target:**
- `UNIQUE (lookup_type, name)` — partial unique index
- `UNIQUE (lookup_type, code)` — partial unique index

---

## Summary of Gaps

| Gap Category | Count | Severity |
|-------------|-------|----------|
| Columns present in MSSQL but missing from DATA_MODEL.md | 22 | High — DDL will not match runtime |
| CHECK constraints in MSSQL but missing from target | 3 (role, status, assigned_team) | Medium — data integrity risk |
| NULLability mismatches (MSSQL → target) | 4 | Medium — will cause insert failures |
| UNIQUE constraints in MSSQL but missing from target | 2 (lookup composite) | Low — covered by app logic |
| `updated_at` column in MSSQL lookup_values only | 1 | Low |
| `asset_id` length mismatch (100→50) | 1 | Medium — truncation risk |
| `asset_description` NULL vs NOT NULL | 1 | Medium — conflicts with service defaults |
