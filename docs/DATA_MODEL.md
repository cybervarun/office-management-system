# Data Model

## Entities

### users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing surrogate key |
| `name` | VARCHAR(255) | NOT NULL | Full display name |
| `email` | VARCHAR(255) | NOT NULL UNIQUE | Login email address |
| `phone` | VARCHAR(30) | NULL | Contact phone number |
| `role` | VARCHAR(50) | NOT NULL | Admin, Help Desk, IT Team, Network Team, Cybersecurity |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt-hashed password |
| `is_active` | BOOLEAN | NOT NULL DEFAULT true | Account activation status |
| `created_at` | TIMESTAMP | NOT NULL DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL DEFAULT NOW() | Last modification timestamp |

**Indexes:** `IX_users_email` on email, `IX_users_phone` on phone

---

### inventory
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Surrogate key |
| `sr_no` | INTEGER | NOT NULL DEFAULT nextval | Sequential asset number |
| `asset_id` | VARCHAR(50) | UNIQUE | Generated hardware identifier (SHA-256 prefix) |
| `serial_number` | VARCHAR(200) | UNIQUE NULL | Manufacturer serial number |
| `mac_address` | VARCHAR(50) | UNIQUE NULL | Network MAC address |
| `asset_category` | VARCHAR(200) | NOT NULL | Asset type (lookup-ref) |
| `asset_description` | VARCHAR(500) | NOT NULL | Descriptive text |
| `asset_user` | VARCHAR(200) | NOT NULL | Named user assigned |
| `asset_current_status` | VARCHAR(100) | NOT NULL | In Use, Stored, Decommissioned |
| `ip_address` | VARCHAR(50) | NULL | IPv4 address |
| `location` | VARCHAR(255) | NULL | Physical location |
| `created_at` | TIMESTAMP | NOT NULL DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update timestamp |

**Additional columns:** make_brand_model, purchase_date, operating_system, network_connection_type, edr_installed, uem_installed, lifecycle dates, remarks (full list in Database_Schema.md)

**Indexes:** `IX_inventory_asset_user` on asset_user, `IX_inventory_serial` on serial_number

---

### tickets
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Surrogate key |
| `title` | VARCHAR(255) | NOT NULL | Short ticket title |
| `description` | TEXT | NOT NULL | Full ticket description |
| `status` | VARCHAR(50) | NOT NULL DEFAULT 'Open' | Open, In Progress, Pending, Resolved, Closed |
| `created_by` | INTEGER | NOT NULL FK → users(id) | User who raised ticket |
| `assigned_team` | VARCHAR(100) | NOT NULL DEFAULT 'IT Help Desk' | Currently responsible team |
| `inventory_id` | INTEGER | NULL FK → inventory(id) | Linked asset (optional) |
| `work_notes` | TEXT | NULL | Aggregated work notes |
| `created_at` | TIMESTAMP | NOT NULL DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL DEFAULT NOW() | Last update timestamp |

**Indexes:** `IX_tickets_status`, `IX_tickets_assigned_team`

---

### ticket_history
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Surrogate key |
| `ticket_id` | INTEGER | NOT NULL FK → tickets(id) | Associated ticket |
| `action` | VARCHAR(100) | NOT NULL | Action type |
| `from_team` | VARCHAR(100) | NULL | Previous team |
| `to_team` | VARCHAR(100) | NULL | New team |
| `note` | VARCHAR(500) | NULL | Contextual note |
| `performed_by` | INTEGER | NOT NULL FK → users(id) | User who acted |
| `created_at` | TIMESTAMP | NOT NULL DEFAULT NOW() | Action timestamp |

**Indexes:** `IX_ticket_history_ticket` on ticket_id

---

### lookup_values
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Surrogate key |
| `lookup_type` | VARCHAR(100) | NOT NULL | Category: asset_category, operating_system, etc. |
| `name` | VARCHAR(255) | NOT NULL | Display value |
| `code` | VARCHAR(100) | NULL | Machine-readable slug |
| `created_at` | TIMESTAMP | NOT NULL DEFAULT NOW() | Creation timestamp |

---

## Relationships
```
users (1) ──── (N) tickets.created_by
users (1) ──── (N) ticket_history.performed_by
tickets (1) ──── (N) ticket_history.ticket_id
inventory (1) ──── (N) tickets.inventory_id (optional)
```

## Data Integrity Rules
- Email uniqueness: UNIQUE constraint on users.email
- Asset ID uniqueness: UNIQUE constraint on inventory.asset_id
- Serial/MAC uniqueness: UNIQUE constraints on inventory.serial_number, inventory.mac_address
- Role values: checked at application level against ROLES constant
- Ticket status: checked at application level against allowed transitions
- Password min length: 8 characters (express-validator)
- MAC format: `^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$`
- IP format: `^(?:\d{1,3}\.){3}\d{1,3}$`
