# Data Model — PostgreSQL

> **Purpose:** Authoritative schema reference for the IT Asset & Ticket Management System.
> **Source:** `docs/PostgreSQL_Schema_DDL.sql` (mirrors this document; always stay in sync)
> **Source of truth:** `docs/PostgreSQL_Schema_DDL.sql` — always keep this document in sync.

---

## Entity Relationship Diagram

```
users ──< tickets >── inventory
  │         │
  │         └──< ticket_history
  │
  └──< lookup_values
```

---

## Table: `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | PK, NOT NULL | Auto-incrementing primary key |
| `name` | `VARCHAR(255)` | NOT NULL | Full name of the user |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE | Login email address |
| `phone` | `VARCHAR(30)` | NULL | Contact phone number |
| `role` | `VARCHAR(50)` | NOT NULL, CHECK | One of: Admin, Help Desk, IT Team, Network Team, Cybersecurity |
| `password_hash` | `VARCHAR(255)` | NOT NULL | bcrypt 10-rounds hashed password |
| `is_active` | `BOOLEAN` | NOT NULL DEFAULT true | Account status flag |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | Account creation timestamp (UTC) |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | Last update timestamp (UTC) |

**Indexes:**
- `UX_users_email` (UNIQUE) — login lookups
- `IX_users_phone` — phone search

---

## Table: `inventory`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | PK, NOT NULL | Auto-incrementing primary key |
| `sr_no` | `INTEGER` | NOT NULL DEFAULT nextval('inventory_sr_no_seq') | Auto-incremented serial number |
| `ministry` | `VARCHAR(200)` | NOT NULL | Ministry/department name |
| `department` | `VARCHAR(200)` | NOT NULL | Department within ministry |
| `mdo_location` | `VARCHAR(200)` | NULL | Mission/desk location |
| `division` | `VARCHAR(200)` | NULL | Organizational division |
| `asset_id` | `VARCHAR(50)` | NOT NULL, UNIQUE | 8-char lowercase hex SHA-256 of (serial_number \|\| mac_address) |
| `serial_number` | `VARCHAR(200)` | NULL, UNIQUE (partial) | Manufacturer serial number |
| `other_asset_category` | `VARCHAR(200)` | NULL | Other category classification |
| `asset_category` | `VARCHAR(100)` | NOT NULL | Category (laptop, desktop, peripheral, etc.) |
| `block_name` | `VARCHAR(200)` | NOT NULL | Building block name |
| `floor` | `VARCHAR(100)` | NOT NULL | Floor number/name |
| `room` | `VARCHAR(100)` | NOT NULL | Room number |
| `workstation` | `VARCHAR(100)` | NOT NULL | Workstation identifier |
| `asset_description` | `TEXT` | NULL | Free-text description |
| `make_brand_model` | `VARCHAR(300)` | NULL | Manufacturer and model |
| `purchase_date` | `DATE` | NULL | Date of purchase |
| `operating_system` | `VARCHAR(100)` | NULL | OS name/version |
| `other_operating_system` | `VARCHAR(100)` | NULL | Other OS (if selected) |
| `ip_address` | `VARCHAR(50)` | NULL | IP address |
| `mac_address` | `VARCHAR(50)` | NULL, UNIQUE (partial) | MAC address |
| `network_connection_type` | `VARCHAR(100)` | NULL | Wired / wireless / both |
| `edr_installed` | `VARCHAR(10)` | NULL | Endpoint detection & response status |
| `reason_no_edr` | `TEXT` | NULL | Justification if EDR not installed |
| `uem_installed` | `VARCHAR(10)` | NULL | Unified endpoint management status |
| `reason_no_uem` | `TEXT` | NULL | Justification if UEM not installed |
| `asset_user` | `VARCHAR(200)` | NOT NULL | Current assigned user |
| `asset_custodian` | `VARCHAR(255)` | NOT NULL | Custodian responsible for asset |
| `asset_current_status` | `VARCHAR(100)` | NOT NULL | Status: Available, Assigned, In Maintenance, etc. |
| `date_of_removal` | `DATE` | NULL | Date asset was removed |
| `installation_date` | `DATE` | NULL | Date asset was installed |
| `end_of_support_date` | `DATE` | NULL | End of vendor support |
| `end_of_life_date` | `DATE` | NULL | Planned retirement date |
| `amc_warranty` | `VARCHAR(10)` | NULL | AMC/warranty status |
| `amc_warranty_expiry_date` | `DATE` | NULL | Warranty expiry |
| `critical` | `VARCHAR(10)` | NULL | Whether asset is critical |
| `remarks` | `TEXT` | NULL | Free-form remarks |
| `designation` | `VARCHAR(200)` | NULL | Asset designation/title |
| `email` | `VARCHAR(255)` | NULL | Legacy user email field |
| `phone` | `VARCHAR(30)` | NULL | Legacy user phone field |
| `custodian` | `VARCHAR(255)` | NULL | Legacy custodian field |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | Creation timestamp (UTC) |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | Last update timestamp (UTC) |

**Indexes:**
- `UX_inventory_asset_id` (UNIQUE) — asset ID lookups
- `UX_inventory_serial` (UNIQUE partial, WHERE serial_number IS NOT NULL) — duplicate serial prevention
- `UX_inventory_mac` (UNIQUE partial, WHERE mac_address IS NOT NULL) — duplicate MAC prevention
- `IX_inventory_asset_user` — user asset search
- `IX_inventory_ministry` — ministry filtering
- `IX_inventory_status` — status filtering
- `IX_inventory_email` — email search
- `IX_inventory_phone` — phone search

---

## Table: `tickets`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | PK, NOT NULL | Auto-incrementing primary key |
| `title` | `VARCHAR(255)` | NOT NULL | Ticket title |
| `description` | `TEXT` | NOT NULL | Ticket description |
| `status` | `VARCHAR(50)` | NOT NULL DEFAULT 'Open', CHECK | Open, In Progress, Pending, Resolved, Closed |
| `created_by` | `INTEGER` | NOT NULL, FK → users(id) | User who created the ticket |
| `assigned_team` | `VARCHAR(100)` | NOT NULL DEFAULT 'IT Help Desk', CHECK | IT Help Desk, IT Team, Network Team, Cybersecurity Team |
| `inventory_id` | `INTEGER` | NULL, FK → inventory(id) | Related asset |
| `work_notes` | `TEXT` | NULL | Internal work notes |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | Creation timestamp (UTC) |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | Last update timestamp (UTC) |

**Indexes:**
- `IX_tickets_status` — status filtering
- `IX_tickets_assigned_team` — team filtering
- `IX_tickets_created_by` — user ticket lookup
- `IX_tickets_inventory` — asset ticket lookup

---

## Table: `ticket_history`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | PK, NOT NULL | Auto-incrementing primary key |
| `ticket_id` | `INTEGER` | NOT NULL, FK → tickets(id) | Related ticket |
| `action` | `VARCHAR(100)` | NOT NULL | Action type (assigned, status_change, note_added, etc.) |
| `from_team` | `VARCHAR(100)` | NULL | Source team (for transfers) |
| `to_team` | `VARCHAR(100)` | NULL | Destination team (for transfers) |
| `note` | `VARCHAR(500)` | NULL | Action note |
| `performed_by` | `INTEGER` | NOT NULL, FK → users(id) | User who performed the action |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | Action timestamp (UTC) |

**Indexes:**
- `IX_ticket_history_ticket` — history per ticket

---

## Table: `lookup_values`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | PK, NOT NULL | Auto-incrementing primary key |
| `lookup_type` | `VARCHAR(100)` | NOT NULL | Dropdown type identifier |
| `name` | `VARCHAR(255)` | NOT NULL | Display name for the option |
| `code` | `VARCHAR(100)` | NULL | Machine-readable code (optional) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL DEFAULT NOW() | Creation timestamp (UTC) |

**Indexes:**
- `UX_lookup_type_name` (UNIQUE on composite) — prevent duplicate dropdown entries
- `UX_lookup_type_code` (UNIQUE partial, WHERE code IS NOT NULL) — prevent duplicate codes

---

## Constraints Summary

| Constraint | Table | Column(s) | Type |
|-----------|-------|-----------|------|
| PK | users | `id` | SERIAL |
| PK | inventory | `id` | SERIAL |
| PK | tickets | `id` | SERIAL |
| PK | ticket_history | `id` | SERIAL |
| PK | lookup_values | `id` | SERIAL |
| UNIQUE | users | `email` | UNIQUE |
| UNIQUE | inventory | `asset_id` | UNIQUE |
| UNIQUE (partial) | inventory | `serial_number` | WHERE IS NOT NULL |
| UNIQUE (partial) | inventory | `mac_address` | WHERE IS NOT NULL |
| UNIQUE | lookup_values | `(lookup_type, name)` | Composite UNIQUE |
| UNIQUE (partial) | lookup_values | `(lookup_type, code)` | WHERE code IS NOT NULL |
| FK | tickets | `created_by` → `users(id)` | ON DELETE RESTRICT |
| FK | tickets | `inventory_id` → `inventory(id)` | ON DELETE SET NULL |
| FK | ticket_history | `ticket_id` → `tickets(id)` | ON DELETE CASCADE |
| FK | ticket_history | `performed_by` → `users(id)` | ON DELETE RESTRICT |
| CHECK | users | `role` | IN ('Admin','Help Desk','IT Team','Network Team','Cybersecurity') |
| CHECK | tickets | `status` | IN ('Open','In Progress','Pending','Resolved','Closed') |
| CHECK | tickets | `assigned_team` | IN ('IT Help Desk','IT Team','Network Team','Cybersecurity Team') |

---

## Sequence

| Sequence Name | Start | Increment | Used By |
|--------------|-------|-----------|---------|
| `inventory_sr_no_seq` | 1 | 1 | `inventory.sr_no` |

---

## Index Recommendations

### Currently Indexed (from DDL)

14 indexes across 5 tables covering all primary foreign key relationships and high-frequency query paths.

### Recommended Additional Indexes

| Priority | Table | Columns | Rationale |
|----------|-------|---------|-----------|
| **High** | `inventory` | `(ministry, asset_current_status)` | Composite for the common "filter by ministry + status" dashboard query |
| **High** | `tickets` | `(created_by, status)` | Composite for "my open tickets" widget |
| **Medium** | `inventory` | `(asset_category, asset_current_status)` | Composite for category-based status breakdowns |
| **Medium** | `ticket_history` | `(performed_by, created_at DESC)` | Timeline view of a user's activity |
| **Low** | `inventory` | `(asset_user, asset_current_status)` | User's active assets list |

### Index Usage Notes

- **Partial indexes** are used for nullable UNIQUE columns (`serial_number`, `mac_address`, `code`). This avoids index bloat on NULL rows and is the PostgreSQL-recommended pattern for nullable uniqueness.
- **TIMESTAMPTZ** timestamps enable timezone-aware queries without application-level conversion.
- **Composite indexes** should be designed in column-order matching the most common WHERE clause patterns.
