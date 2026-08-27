# Database Schema

**Version:** 1.0.0
**Date:** 2026-08-24
**Engine:** Microsoft SQL Server
**Database:** OfficeManagement

---

## 1. Entity-Relationship Overview

```
┌──────────┐       ┌───────────┐       ┌──────────┐
│  users   │──1:N──│  tickets  │──1:N──│ticket_   │
│          │       │           │       │ history  │
└────┬─────┘       └─────┬─────┘       └──────────┘
     │                   │
     │                   │ N:1 (optional)
     │                   ▼
     │            ┌───────────┐
     └───────────▶│ inventory │
                  └───────────┘
                          │
                          │ N:1 (lookup reference)
                          ▼
                  ┌──────────────────┐
                  │  lookup_values   │
                  └──────────────────┘
```

---

## 2. Table Definitions

### 2.1 `users`

Stores system user accounts with authentication and role information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `INT` | `IDENTITY(1,1) PRIMARY KEY` | Auto-incrementing surrogate key |
| `name` | `NVARCHAR(255)` | `NOT NULL` | Full display name |
| `email` | `NVARCHAR(255)` | `NOT NULL UNIQUE` | Login email address |
| `phone` | `NVARCHAR(30)` | `NULL` | Contact phone number |
| `role` | `NVARCHAR(50)` | `NOT NULL CHECK IN (...)` | Role: Admin, Help Desk, IT Team, Network Team, Cybersecurity |
| `password_hash` | `NVARCHAR(255)` | `NOT NULL` | bcrypt-hashed password |
| `is_active` | `BIT` | `NOT NULL DEFAULT 1` | Account activation status |
| `created_at` | `DATETIME2` | `NOT NULL DEFAULT SYSUTCDATETIME()` | Record creation timestamp |
| `updated_at` | `DATETIME2` | `NOT NULL DEFAULT SYSUTCDATETIME()` | Last modification timestamp |

**Indexes:**
- `IX_users_email` on `email` — supports login lookups
- `IX_users_phone` on `phone` — supports user search

---

### 2.2 `inventory`

Government-standard IT asset registry with lifecycle tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `INT` | `IDENTITY(1,1) PRIMARY KEY` | Surrogate key |
| `sr_no` | `INT` | `NOT NULL DEFAULT (NEXT VALUE FOR inventory_sr_no_seq)` | Sequential asset number |
| `ministry` | `NVARCHAR(200)` | `NOT NULL` | Parent ministry |
| `department` | `NVARCHAR(200)` | `NOT NULL` | Operating department |
| `mdo_location` | `NVARCHAR(200)` | `NULL` | MDO (Major Departmental Office) location |
| `division` | `NVARCHAR(200)` | `NULL` | Division within department |
| `asset_id` | `NVARCHAR(50)` | `UNIQUE` | Generated hardware identifier (SHA-256 prefix) |
| `serial_number` | `NVARCHAR(200)` | `UNIQUE NULL` | Manufacturer serial number |
| `other_asset_category` | `NVARCHAR(200)` | `NULL` | Free-text category if not in lookup |
| `asset_category` | `NVARCHAR(200)` | `NOT NULL` | Asset type (lookup-ref or free-text) |
| `block_name` | `NVARCHAR(200)` | `NULL` | Building/block name |
| `floor` | `NVARCHAR(50)` | `NULL` | Floor number |
| `room` | `NVARCHAR(100)` | `NULL` | Room number |
| `workstation` | `NVARCHAR(100)` | `NULL` | Workstation identifier |
| `asset_description` | `NVARCHAR(500)` | `NOT NULL` | Descriptive text for the asset |
| `make_brand_model` | `NVARCHAR(500)` | `NULL` | Manufacturer and model |
| `purchase_date` | `DATE` | `NULL` | Date of purchase |
| `operating_system` | `NVARCHAR(200)` | `NULL` | OS (lookup-ref or free-text) |
| `other_operating_system` | `NVARCHAR(200)` | `NULL` | Free-text OS override |
| `ip_address` | `NVARCHAR(50)` | `NULL` | IPv4 address |
| `mac_address` | `NVARCHAR(50)` | `UNIQUE NULL` | Network MAC address |
| `network_connection_type` | `NVARCHAR(200)` | `NULL` | Network connection type |
| `edr_installed` | `NVARCHAR(50)` | `NULL` | EDR software status |
| `reason_no_edr` | `NVARCHAR(500)` | `NULL` | Justification if no EDR |
| `uem_installed` | `NVARCHAR(50)` | `NULL` | UEM software status |
| `reason_no_uem` | `NVARCHAR(500)` | `NULL` | Justification if no UEM |
| `asset_user` | `NVARCHAR(200)` | `NOT NULL` | Named user assigned to asset |
| `asset_custodian` | `NVARCHAR(200)` | `NOT NULL` | Custodian responsible for asset |
| `asset_current_status` | `NVARCHAR(100)` | `NOT NULL` | Status: e.g., In Use, Stored, Decommissioned |
| `date_of_removal` | `DATE` | `NULL` | Asset removal date |
| `installation_date` | `DATE` | `NULL` | Deployment/installation date |
| `end_of_support_date` | `DATE` | `NULL` | Vendor support end date |
| `end_of_life_date` | `DATE` | `NULL` | Planned obsolescence date |
| `amc_warranty` | `NVARCHAR(500)` | `NULL` | AMC/warranty provider details |
| `amc_warranty_expiry_date` | `DATE` | `NULL` | Warranty expiry date |
| `critical` | `NVARCHAR(50)` | `NULL` | Criticality flag |
| `remarks` | `NVARCHAR(MAX)` | `NULL` | Free-form notes |
| `designation` | `NVARCHAR(200)` | `NULL` | Legacy: user designation |
| `email` | `NVARCHAR(255)` | `NULL` | Legacy: user email |
| `phone` | `NVARCHAR(30)` | `NULL` | Legacy: user phone |
| `custodian` | `NVARCHAR(200)` | `NULL` | Legacy: custodian field |
| `created_at` | `DATETIME2` | `NOT NULL DEFAULT SYSUTCDATETIME()` | Creation timestamp |
| `updated_at` | `DATETIME2` | `NOT NULL DEFAULT SYSUTCDATETIME()` | Last update timestamp |

**Indexes:**
- `IX_inventory_asset_user` on `asset_user` — supports user search
- `IX_inventory_email` on `email` — legacy search support
- `IX_inventory_phone` on `phone` — legacy search support

---

### 2.3 `tickets`

Help-desk support tickets with team assignment and status tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `INT` | `IDENTITY(1,1) PRIMARY KEY` | Surrogate key |
| `title` | `NVARCHAR(255)` | `NOT NULL` | Short ticket title |
| `description` | `NVARCHAR(MAX)` | `NOT NULL` | Full ticket description |
| `status` | `NVARCHAR(50)` | `NOT NULL DEFAULT 'Open'` | Open, In Progress, Pending, Resolved, Closed |
| `created_by` | `INT` | `NOT NULL FK → users(id)` | User who raised the ticket |
| `assigned_team` | `NVARCHAR(100)` | `NOT NULL DEFAULT 'IT Help Desk'` | Currently responsible team |
| `inventory_id` | `INT` | `NULL FK → inventory(id)` | Linked asset (optional) |
| `work_notes` | `NVARCHAR(MAX)` | `NULL` | Aggregated work notes (denormalized) |
| `created_at` | `DATETIME2` | `NOT NULL DEFAULT SYSUTCDATETIME()` | Ticket creation time |
| `updated_at` | `DATETIME2` | `NOT NULL DEFAULT SYSUTCDATETIME()` | Last status/note update time |

**Indexes:**
- `IX_tickets_status` on `status` — supports status filtering
- `IX_tickets_assigned_team` on `assigned_team` — supports team filtering

---

### 2.4 `ticket_history`

Immutable audit log for all ticket state changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `INT` | `IDENTITY(1,1) PRIMARY KEY` | Surrogate key |
| `ticket_id` | `INT` | `NOT NULL FK → tickets(id)` | Associated ticket |
| `action` | `NVARCHAR(100)` | `NOT NULL` | Action type: "Status Changed", "Team Assigned", "Work Note Added", etc. |
| `from_team` | `NVARCHAR(100)` | `NULL` | Previous team (for transfers) |
| `to_team` | `NVARCHAR(100)` | `NULL` | New team (for transfers) |
| `note` | `NVARCHAR(500)` | `NULL` | Contextual note |
| `performed_by` | `INT` | `NOT NULL FK → users(id)` | User who performed the action |
| `created_at` | `DATETIME2` | `NOT NULL DEFAULT SYSUTCDATETIME()` | Action timestamp |

**Indexes:**
- `IX_ticket_history_ticket` on `ticket_id` — supports history lookup per ticket

---

### 2.5 `lookup_values`

Dropdown option registry. Values stored here are returned by the `/dropdowns` endpoint.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `INT` | `IDENTITY(1,1) PRIMARY KEY` | Surrogate key |
| `lookup_type` | `NVARCHAR(100)` | `NOT NULL` | Category: ministry, department, asset_category, operating_system, network_connection_type |
| `name` | `NVARCHAR(255)` | `NOT NULL` | Display value |
| `code` | `NVARCHAR(100)` | `NULL` | Machine-readable slug (auto-generated from name) |
| `created_at` | `DATETIME2` | `NOT NULL DEFAULT SYSUTCDATETIME()` | Creation timestamp |

> **Note:** The schema.sql DDL for this table is present in the migration script. The `code` column is auto-generated server-side from the `name` field.

---

### 2.6 Sequence

| Name | Start | Increment | Usage |
|------|-------|-----------|-------|
| `inventory_sr_no_seq` | 1 | 1 | Default value for `inventory.sr_no` |

---

## 3. Relationships

```
users (1) ──────── (N) tickets.created_by
users (1) ──────── (N) ticket_history.performed_by
tickets (1) ──────── (N) ticket_history.ticket_id
inventory (1) ──────── (N) tickets.inventory_id   (optional link)
```

**Referential Integrity:**
- `tickets.created_by` → `users.id` — enforced via foreign key
- `tickets.inventory_id` → `inventory.id` — enforced via foreign key (nullable)
- `ticket_history.ticket_id` → `tickets.id` — enforced via foreign key
- `ticket_history.performed_by` → `users.id` — enforced via foreign key

---

## 4. Indexing Strategy

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| `users` | `PK` | Clustered (implicit) | Primary lookups by id |
| `users` | `IX_users_email` | Non-clustered | Login by email (UNIQUE) |
| `users` | `IX_users_phone` | Non-clustered | Search by phone |
| `inventory` | `PK` | Clustered (implicit) | Primary lookups by id |
| `inventory` | `UQ__inventory__*` (asset_id) | Non-clustered UNIQUE | Asset ID lookups |
| `inventory` | `UQ__inventory__*` (serial_number) | Non-clustered UNIQUE | Prevent serial duplicates |
| `inventory` | `UQ__inventory__*` (mac_address) | Non-clustered UNIQUE | Prevent MAC duplicates |
| `inventory` | `IX_inventory_asset_user` | Non-clustered | User-based asset search |
| `inventory` | `IX_inventory_email` | Non-clustered | Legacy email search |
| `inventory` | `IX_inventory_phone` | Non-clustered | Legacy phone search |
| `tickets` | `PK` | Clustered (implicit) | Primary lookups by id |
| `tickets` | `IX_tickets_status` | Non-clustered | Status filtering |
| `tickets` | `IX_tickets_assigned_team` | Non-clustered | Team filtering |
| `ticket_history` | `PK` | Clustered (implicit) | Primary lookups by id |
| `ticket_history` | `IX_ticket_history_ticket` | Non-clustered | Ticket history lookup |

---

## 5. Data Integrity Rules

| Rule | Enforcement |
|------|------------|
| Email uniqueness | `UNIQUE` constraint on `users.email` |
| Asset ID uniqueness | `UNIQUE` constraint on `inventory.asset_id` |
| Serial number uniqueness | `UNIQUE` constraint on `inventory.serial_number` (nullable unique) |
| MAC address uniqueness | `UNIQUE` constraint on `inventory.mac_address` (nullable unique) |
| Role values | `CHECK` constraint on `users.role` |
| Ticket status values | Application-level enum validation (Open, In Progress, Pending, Resolved, Closed) |
| Team values | Application-level enum validation against `TEAMS` constant |
| Password minimum length | express-validator: `isLength({ min: 8 })` |
| MAC format | Regex: `^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$` |
| IP format | Regex: `^(?:\d{1,3}\.){3}\d{1,3}$` |
| ISO dates | `isISO8601()` validator on date fields |
| Asset ID generation | At least one of `serial_number` or `mac_address` must be non-empty |
