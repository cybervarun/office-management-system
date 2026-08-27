# System Design Document
## Government Office & Inventory Management System (v2035)

**Document Version:** 1.0.0
**Date:** 2026-08-24
**Classification:** UNCLASSIFIED — Government Internal Use
**Status:** DRAFT
**Author:** Lead Technical Writer / Software Architect

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Database Design](#3-database-design)
4. [API Design](#4-api-design)
5. [Security, Compliance & Audit](#5-security-compliance--audit)
6. [Business Logic & Workflows](#6-business-logic--workflows)
7. [Infrastructure & Deployment](#7-infrastructure--deployment)
8. [Future Enhancements](#8-future-enhancements)

---

## 1. Executive Summary

### 1.1 System Overview

The **Government Office & Inventory Management System (v2035)** is a web-based application designed to support IT asset tracking, ticketing, user management, and reporting for a government ministry. The system serves five role-based user groups: **Admin**, **Help Desk**, **IT Team**, **Network Team**, and **Cybersecurity** personnel.

The system provides:
- **Asset Inventory Management** — Full CRUD for IT assets with government-standard fields (ministry, department, MDO location, serial numbers, MAC addresses, EDR/UEM compliance)
- **IT Service Desk** — Ticket creation, assignment, status tracking, and team transfers
- **User Administration** — Role-based user lifecycle management
- **Analytics Dashboard** — Real-time asset and ticket statistics
- **Reports** — Aggregated data exports for audit and planning
- **Settings** — Notification preferences and system configuration

### 1.2 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite 7 | SPA with client-side routing |
| Backend | Node.js + Express | RESTful API server |
| Database | Microsoft SQL Server | Relational data persistence |
| Auth | JWT + bcryptjs | Token-based auth with password hashing |
| Validation | express-validator | Server-side input validation |
| Testing | Playwright / Puppeteer | E2E browser automation |

### 1.3 Design Principles

1. **Security First** — All endpoints require authentication; sensitive operations require Admin or Help Desk role
2. **Data Integrity** — SQL Server CHECK constraints, UNIQUE indexes, and foreign key relationships enforce referential integrity
3. **Auditability** — Ticket lifecycle changes are logged in `ticket_history`; user actions are traceable via `performed_by`
4. **RBAC** — Five distinct roles with granular permission boundaries
5. **Government Compliance** — Structured inventory fields aligned with government IT asset reporting standards (MDO location, EDR/UEM compliance tracking)

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vite/React)                    │
│  ┌──────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────────┐ │
│  │  Dashboard│ │ Inventory │ │  Tickets  │ │   Users Admin   │ │
│  └──────────┘ └───────────┘ └───────────┘ └─────────────────┘ │
│  ┌──────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────────┐ │
│  │ Reports  │ │  Settings │ │  Login    │ │ ProtectedRoute  │ │
│  └──────────┘ └───────────┘ └───────────┘ └─────────────────┘ │
│  Services: api.js, authService, inventoryService, ticketService│
│           userService, reportsService, settingsService         │
└───────────────────────────┬───────────────────────────────────┘
                            │ HTTP/REST (Bearer JWT)
┌───────────────────────────▼───────────────────────────────────┐
│                     BACKEND (Express)                         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Middleware Layer                                         │  │
│  │  ├── Security Headers (HSTS, X-Frame-Options, CSP)       │  │
│  │  ├── CORS (origin-restricted)                            │  │
│  │  ├── express.json()                                      │  │
│  │  ├── auth (JWT verification)                             │  │
│  │  ├── rbac (role-based access control)                    │  │
│  │  ├── validate (express-validator results)                │  │
│  │  └── errorHandler (centralized error handling)           │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Routes → Controllers → Services → Database              │  │
│  │  /api/auth     → authController     → authService         │  │
│  │  /api/users    → userController     → userService         │  │
│  │  /api/inventory → inventoryController → inventoryService   │  │
│  │  /api/tickets  → ticketController   → ticketService       │  │
│  │  /api/dashboard → dashboardController → dashboardService  │  │
│  │  /api/reports  → reportsController  → reportsService      │  │
│  │  /api/settings → settingsController → settingsService     │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────┬───────────────────────────────────┘
                            │ mssql driver
┌───────────────────────────▼───────────────────────────────────┐
│              DATABASE (SQL Server — OfficeManagement)          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │
│  │  users   │ │inventory │ │  tickets │ │ ticket_history  │  │
│  └──────────┘ └──────────┘ └──────────┘ └─────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  lookup_values                                          │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Backend Architecture

**Entry Point:** `backend/app.js`
- Mounts all API route groups under `/api/*`
- Applies global security headers and CORS
- Handles unhandled promise rejections and uncaught exceptions
- Initializes SQL Server connection pool on startup

**Middleware Chain (per route):**
```
Request → auth (JWT verify) → rbac (role check) → validate (schema) → controller → service → db
```

**Key Middleware:**
| File | Purpose |
|------|---------|
| `middlewares/auth.js` | Verifies JWT, attaches `req.user` {id, email, role, name} |
| `middlewares/rbac.js` | `allowRoles(...roles)` — returns 403 if role not permitted |
| `middlewares/validate.js` | Calls `next()` on valid input, 400 with details on failure |
| `middlewares/errorHandler.js` | Catches all errors, returns `{error: message}` with status code |

**Utility Layer:**
| File | Purpose |
|------|---------|
| `utils/asyncHandler.js` | Wraps async controllers to catch rejected promises |
| `utils/ApiError.js` | Standard error class with `statusCode` property |
| `utils/pagination.js` | `parsePagination()` + `paginatedResponse()` with max page size 100 |

**Model Constants:** `backend/models/constants.js`
```javascript
ROLES = ["Admin", "Help Desk", "IT Team", "Network Team", "Cybersecurity"]
TEAMS = ["IT Help Desk", "IT Team", "Network Team", "Cybersecurity Team"]
```

### 2.3 Frontend Architecture

**Entry Point:** `frontend/src/main.jsx`
**App Router:** `frontend/src/App.jsx` — React Router v7 with protected routes

**Routing Map:**
| Path | Component | Auth Required |
|------|-----------|---------------|
| `/login` | `Login.jsx` | No (redirects to `/` if authenticated) |
| `/` | `Dashboard.jsx` | Yes |
| `/inventory` | `InventoryManagement.jsx` | Yes |
| `/tickets` | `TicketsList.jsx` | Yes |
| `/raise-ticket` | `RaiseTicketForm.jsx` | Yes |
| `/users` | `UsersManagement.jsx` | Yes (Admin only) |
| `/reports` | `Reports.jsx` | Yes |
| `/settings` | `Settings.jsx` | Yes (Admin only) |

**Authentication Flow:**
1. User submits email/password via `Login.jsx`
2. `authService.login()` calls `POST /api/auth/login`
3. Backend returns `{token, user}`
4. `useAuth` hook stores token in `localStorage`
5. Axios `api.js` interceptor attaches `Authorization: Bearer <token>` to all requests
6. `ProtectedRoute.jsx` guards all authenticated routes

**Reusable Components:**
| Component | Purpose |
|-----------|---------|
| `Button.jsx` | Primary/secondary/ghost variants, icon support |
| `Modal.jsx` | Backdrop, close-on-escape, footer actions |
| `Table.jsx` | Striped rows, hover states |
| `Badge.jsx` | Status color coding (success/info/warning/neutral) |
| `Select.jsx` | Dropdown with optional "Add New" option |
| `FormInput.jsx` | Labeled input with error display |
| `FormSection.jsx` | Grouped form fields with title/description |
| `AddDropdownItemModal.jsx` | Inline creation of new lookup values |
| `Layout.jsx` | Sidebar navigation, topbar, mobile responsive |

### 2.4 Layered Data Flow

```
Frontend Service (axios call)
    ↓
Backend Route (express Router)
    ↓
Middleware: auth → rbac → validate
    ↓
Controller (asyncHandler wrapper)
    ↓
Service (business logic, DB queries)
    ↓
Database (config/db.js → executeQuery)
    ↓
Result propagates back up the stack
```

---

## 3. Database Design

### 3.1 Entity-Relationship Overview

```
┌──────────┐       ┌───────────┐       ┌──────────┐
│  users   │───────│  tickets  │       │ inventory│
│  (PK:id) │  1:N  │  (PK:id)  │  N:1  │  (PK:id) │
└──────────┘       └─────┬─────┘       └──────────┘
                         │ 1:N
                         ↓
                   ┌───────────────┐
                   │ ticket_history│
                   │  (FK: ticket_id)│
                   │  (FK: performed_by→users)│
                   └───────────────┘

┌──────────────────┐
│  lookup_values   │
│  (used by inventory dropdowns)│
└──────────────────┘
```

### 3.2 Table Definitions

#### 3.2.1 `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, IDENTITY(1,1) | Auto-incrementing primary key |
| `name` | NVARCHAR(255) | NOT NULL | Full name of user |
| `email` | NVARCHAR(255) | NOT NULL, UNIQUE | Login identifier |
| `phone` | NVARCHAR(30) | NULL | Contact number |
| `role` | NVARCHAR(50) | NOT NULL, CHECK | One of: Admin, Help Desk, IT Team, Network Team, Cybersecurity |
| `password_hash` | NVARCHAR(255) | NOT NULL | bcrypt-hashed password |
| `is_active` | BIT | NOT NULL, DEFAULT 1 | Account status flag |
| `created_at` | DATETIME2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Record creation timestamp |
| `updated_at` | DATETIME2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Last update timestamp |

**Indexes:**
- `IX_users_email` on `email`
- `IX_users_phone` on `phone`

#### 3.2.2 `inventory`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, IDENTITY(1,1) | Auto-incrementing primary key |
| `sr_no` | INT | NOT NULL, DEFAULT next value for seq | Auto-incrementing serial number from sequence |
| `ministry` | NVARCHAR(200) | NOT NULL | Government ministry name |
| `department` | NVARCHAR(200) | NOT NULL | Department within ministry |
| `mdo_location` | NVARCHAR(200) | NULL | MDO (Major Departmental Office) location |
| `division` | NVARCHAR(200) | NULL | Division/Section/Group |
| `asset_id` | NVARCHAR(100) | NOT NULL, UNIQUE | System-generated unique asset identifier (ASSET-<12-char hex>) |
| `serial_number` | NVARCHAR(200) | NULL | Hardware serial number (unique when present) |
| `asset_category` | NVARCHAR(100) | NOT NULL | Category from lookup or free text |
| `other_asset_category` | NVARCHAR(200) | NULL | Custom category when "Other" selected |
| `block_name` | NVARCHAR(200) | NOT NULL | Physical building block |
| `floor` | NVARCHAR(100) | NOT NULL | Floor number |
| `room` | NVARCHAR(100) | NOT NULL | Room number |
| `workstation` | NVARCHAR(100) | NOT NULL | Workstation identifier |
| `asset_description` | NVARCHAR(MAX) | NULL | Free-text asset description |
| `make_brand_model` | NVARCHAR(300) | NULL | Manufacturer and model |
| `purchase_date` | DATE | NULL | Date of purchase |
| `operating_system` | NVARCHAR(100) | NULL | OS from lookup |
| `other_operating_system` | NVARCHAR(100) | NULL | Custom OS |
| `ip_address` | NVARCHAR(50) | NULL | IP address (validated format) |
| `mac_address` | NVARCHAR(50) | NULL | MAC address (validated format, unique when present) |
| `network_connection_type` | NVARCHAR(100) | NULL | Ethernet/WiFi/Both/None |
| `edr_installed` | NVARCHAR(10) | NULL | Yes/No |
| `reason_no_edr` | NVARCHAR(MAX) | NULL | Justification if EDR not installed |
| `uem_installed` | NVARCHAR(10) | NULL | Yes/No |
| `reason_no_uem` | NVARCHAR(MAX) | NULL | Justification if UEM not installed |
| `asset_user` | NVARCHAR(255) | NOT NULL | Assigned user name |
| `asset_custodian` | NVARCHAR(255) | NOT NULL | Custodian name |
| `asset_current_status` | NVARCHAR(100) | NULL | Available/Assigned/In Maintenance/Retired/Lost/Damaged |
| `date_of_removal` | DATE | NULL | Asset removal date |
| `installation_date` | DATE | NULL | Installation date |
| `end_of_support_date` | DATE | NULL | Vendor support end date |
| `end_of_life_date` | DATE | NULL | Planned end of life |
| `amc_warranty` | NVARCHAR(10) | NULL | AMC/Warranty/None |
| `amc_warranty_expiry_date` | DATE | NULL | Warranty expiry |
| `critical` | NVARCHAR(10) | NULL | Yes/No |
| `remarks` | NVARCHAR(MAX) | NULL | Additional remarks |
| `designation` | NVARCHAR(200) | NULL | Legacy field |
| `email` | NVARCHAR(255) | NULL | Legacy field |
| `phone` | NVARCHAR(30) | NULL | Legacy field |
| `custodian` | NVARCHAR(255) | NULL | Legacy field |
| `created_at` | DATETIME2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Record creation timestamp |
| `updated_at` | DATETIME2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Last update timestamp |

**Indexes:**
- `UX_inventory_asset_id` — UNIQUE on `asset_id`
- `UX_inventory_serial` — UNIQUE partial on `serial_number` (WHERE serial_number IS NOT NULL)
- `UX_inventory_mac` — UNIQUE partial on `mac_address` (WHERE mac_address IS NOT NULL)
- `IX_inventory_asset_user` on `asset_user`
- `IX_inventory_email` on `email`
- `IX_inventory_phone` on `phone`

**Sequence:**
- `inventory_sr_no_seq` — START WITH 1, INCREMENT BY 1 (used for `sr_no` default)

#### 3.2.3 `lookup_values`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, IDENTITY(1,1) | Auto-incrementing primary key |
| `lookup_type` | NVARCHAR(100) | NOT NULL | Category (ministry, department, asset_category, etc.) |
| `name` | NVARCHAR(255) | NOT NULL | Display name |
| `code` | NVARCHAR(100) | NOT NULL | Machine-readable code |
| `created_at` | DATETIME2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Record creation timestamp |
| `updated_at` | DATETIME2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Last update timestamp |

**Indexes:**
- `UX_lookup_values_type_name` — UNIQUE on `(lookup_type, name)`
- `UX_lookup_values_type_code` — UNIQUE on `(lookup_type, code)`

#### 3.2.4 `tickets`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, IDENTITY(1,1) | Auto-incrementing primary key |
| `title` | NVARCHAR(255) | NOT NULL | Ticket title |
| `description` | NVARCHAR(MAX) | NOT NULL | Detailed description |
| `status` | NVARCHAR(50) | NOT NULL, CHECK | Open/In Progress/Pending/Resolved/Closed |
| `assigned_team` | NVARCHAR(100) | NOT NULL, CHECK | IT Help Desk/IT Team/Network Team/Cybersecurity Team |
| `created_by` | INT | NOT NULL, FK→users(id) | User who created the ticket |
| `inventory_id` | INT | NULL, FK→inventory(id) | Related asset (optional) |
| `work_notes` | NVARCHAR(MAX) | NULL | Accumulated work notes (appended over time) |
| `created_at` | DATETIME2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Ticket creation timestamp |
| `updated_at` | DATETIME2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Last update timestamp |

**Foreign Keys:**
- `FK_tickets_users` → `users(id)`
- `FK_tickets_inventory` → `inventory(id)`

**Indexes:**
- `IX_tickets_status` on `status`
- `IX_tickets_assigned_team` on `assigned_team`

#### 3.2.5 `ticket_history`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INT | PK, IDENTITY(1,1) | Auto-incrementing primary key |
| `ticket_id` | INT | NOT NULL, FK→tickets(id) | Associated ticket |
| `action` | NVARCHAR(100) | NOT NULL | Action type (Created/Assigned/Transferred/Status Updated/Work Note Added/Deleted) |
| `from_team` | NVARCHAR(100) | NULL | Source team (for assignments/transfers) |
| `to_team` | NVARCHAR(100) | NULL | Destination team |
| `note` | NVARCHAR(500) | NULL | Human-readable note |
| `performed_by` | INT | NOT NULL, FK→users(id) | User who performed the action |
| `created_at` | DATETIME2 | NOT NULL, DEFAULT SYSUTCDATETIME() | Timestamp of action |

**Foreign Keys:**
- `FK_ticket_history_ticket` → `tickets(id)`
- `FK_ticket_history_user` → `users(id)`

**Indexes:**
- `IX_ticket_history_ticket` on `ticket_id`

### 3.3 Data Integrity Controls

| Control | Implementation |
|---------|---------------|
| NOT NULL constraints | All critical fields enforce presence |
| CHECK constraints | `role`, `status`, `assigned_team` validated at DB level |
| UNIQUE constraints | `email`, `asset_id`, `serial_number` (partial), `mac_address` (partial) |
| UNIQUE indexes (composite) | `lookup_values(lookup_type, name)` and `(lookup_type, code)` |
| Foreign keys | `tickets.created_by → users.id`, `tickets.inventory_id → inventory.id`, `ticket_history.ticket_id → tickets.id`, `ticket_history.performed_by → users.id` |
| Default values | `SYSUTCDATETIME()` for all timestamp fields; sequence for `sr_no` |

### 3.4 Gap Analysis — Missing Audit Table

**Critical Gap:** There is **no audit log table** for inventory changes (create, edit, delete) or user management changes (create, role change, password reset, activate/deactivate). The only audit trail exists for ticket operations via `ticket_history`.

**Recommended Addition:**
```sql
CREATE TABLE audit_log (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    table_name NVARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action NVARCHAR(50) NOT NULL,  -- INSERT/UPDATE/DELETE
    old_values NVARCHAR(MAX) NULL,  -- JSON snapshot before change
    new_values NVARCHAR(MAX) NULL,  -- JSON snapshot after change
    performed_by INT NOT NULL,
    ip_address NVARCHAR(50) NULL,
    user_agent NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_audit_user FOREIGN KEY (performed_by) REFERENCES users(id)
);
CREATE INDEX IX_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX IX_audit_performed_by ON audit_log(performed_by);
CREATE INDEX IX_audit_created_at ON audit_log(created_at);
```

---

## 4. API Design

### 4.1 Authentication

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/auth/login` | No | — | Login with email/password, returns JWT |

**Request Body:**
```json
{
  "email": "admin@local",
  "password": "SecureAdmin@2024!"
}
```

**Response (200):**
```json
{
  "token": "eyJ...",
  "user": { "id": 1, "name": "Administrator", "email": "admin@local", "role": "Admin" }
}
```

### 4.2 Users Management

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/users` | Yes | Admin | List users (paginated) |
| POST | `/api/users` | Yes | Admin | Create user |
| PATCH | `/api/users/:id` | Yes | Admin | Update user details |
| PATCH | `/api/users/:id/role` | Yes | Admin | Change user role |
| PATCH | `/api/users/:id/password` | Yes | Admin | Reset user password |
| PATCH | `/api/users/:id/activate` | Yes | Admin | Activate user |
| PATCH | `/api/users/:id/deactivate` | Yes | Admin | Deactivate user |
| GET | `/api/users/search` | Yes | All | Search users (top 25) |

### 4.3 Inventory Management

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/inventory/dropdowns` | Yes | All | Get all dropdown value sets |
| GET | `/api/inventory/search-user` | Yes | All | Search assets by user/email/phone |
| GET | `/api/inventory` | Yes | All | List assets (paginated, filterable, sortable) |
| GET | `/api/inventory/:id` | Yes | All | Get single asset details |
| POST | `/api/inventory` | Yes | Admin, Help Desk | Add new asset |
| PUT | `/api/inventory/:id` | Yes | Admin, Help Desk | Edit asset |
| DELETE | `/api/inventory/:id` | Yes | Admin, Help Desk | Delete asset (hard delete) |
| POST | `/api/inventory/dropdowns` | Yes | All | Add new dropdown value |

**Query Parameters (GET /inventory):**
| Param | Type | Description |
|-------|------|-------------|
| `page` | int | Page number (default: 1) |
| `pageSize` | int | Items per page (default: 20, max: 100) |
| `sortBy` | string | Sort column (whitelist validated) |
| `sortDirection` | string | ASC or DESC (default: DESC) |
| `search` | string | Multi-field LIKE search |
| `ministry` | string | Filter by ministry |
| `department` | string | Filter by department |
| `asset_category` | string | Filter by category |
| `asset_current_status` | string | Filter by status |
| `edr_installed` | string | Filter by EDR status |
| `uem_installed` | string | Filter by UEM status |

**Validation Rules (POST /inventory):**
- `ministry` — required
- `department` — required
- `asset_category` — required
- `asset_description` — required
- `asset_user` — required
- `asset_custodian` — required
- `asset_current_status` — required
- `serial_number` OR `mac_address` — at least one required
- `mac_address` — regex validated: `^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$`
- `ip_address` — format validated: `^(?:\d{1,3}\.){3}\d{1,3}$`
- Date fields — ISO 8601 validated

### 4.4 Ticket Management

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/tickets` | Yes | All | List tickets (paginated) |
| GET | `/api/tickets/:id` | Yes | All | Get ticket with history |
| POST | `/api/tickets` | Yes | Admin, Help Desk | Create ticket |
| PATCH | `/api/tickets/:id/assign` | Yes | Admin, Help Desk | Assign to team |
| PATCH | `/api/tickets/:id/status` | Yes | All | Update ticket status |
| PATCH | `/api/tickets/:id/work-notes` | Yes | All | Add work note |
| POST | `/api/tickets/transfer` | Yes | All | Transfer between teams |
| GET | `/api/tickets/users/search` | Yes | All | Search users for ticket creation |
| DELETE | `/api/tickets/:id` | Yes | Admin, Help Desk | Delete ticket |

**Ticket Status Workflow:**
```
Open → In Progress → Pending → Resolved → Closed
                              ↕
                    (any status can transition to any other)
```

**Team Assignment Workflow:**
```
IT Help Desk ↔ IT Team ↔ Network Team ↔ Cybersecurity Team
(Transfers are logged in ticket_history with from_team/to_team)
```

### 4.5 Dashboard

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/dashboard` | Yes | Admin, Help Desk, IT Team | Get stats and recent items |

**Response:**
```json
{
  "totalAssets": 150,
  "assignedAssets": 120,
  "availableAssets": 25,
  "inMaintenance": 5,
  "openTickets": 12,
  "recentAssets": [...],
  "recentTickets": [...]
}
```

### 4.6 Reports

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/reports` | Yes | Admin, Help Desk, IT Team | Get aggregated reports |

**Response includes:**
- `assetsByStatus` — count grouped by `asset_current_status`
- `assetsByMinistry` — top 10 ministries by asset count
- `ticketsByTeam` — count grouped by `assigned_team`
- `ticketsByStatus` — count grouped by `status`
- `ticketTrend` — daily ticket creation count (last 30 days)
- `totals` — `{totalAssets, totalTickets, openTickets, resolvedTickets}`
- `usersByRole` — count grouped by `role`

### 4.7 Settings

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/settings` | Yes | Admin | Get roles, teams, role stats, notification defaults, system info |
| PATCH | `/api/settings/notifications` | Yes | Admin | Update notification preferences |

### 4.8 API Error Response Format

All errors follow a consistent format:
```json
{
  "error": "Human-readable error message"
}
```

Validation errors include details:
```json
{
  "error": "Validation failed",
  "details": [
    { "type": "field", "value": "...", "msg": "Ministry is required", "path": "ministry", "location": "body" }
  ]
}
```

---

## 5. Security, Compliance & Audit

### 5.1 Authentication & Authorization

#### 5.1.1 JWT Authentication
- **Algorithm:** HS256 (HMAC-SHA256)
- **Secret:** `process.env.JWT_SECRET` (must be configured, never hardcoded)
- **Expiration:** `process.env.JWT_EXPIRES_IN` (default: 8h)
- **Token format:** `Bearer <token>` in `Authorization` header
- **Payload:** `{ id, email, role, name }`

#### 5.1.2 Password Security
- **Hashing:** bcryptjs with cost factor 12 (create_admin.js) / 10 (userService.js)
- **Minimum length:** 8 characters (enforced at both frontend and backend)
- **Reset mechanism:** `create_admin.js --reset` generates a 22-character base64url one-time password
- **Password fingerprint:** SHA-256 of the plaintext password, first 8 hex characters (for verification without exposing the password)

#### 5.1.3 Role-Based Access Control (RBAC) Matrix

| Feature | Admin | Help Desk | IT Team | Network Team | Cybersecurity |
|---------|:-----:|:---------:|:-------:|:------------:|:-------------:|
| Login | ✓ | ✓ | ✓ | ✓ | ✓ |
| View Dashboard | ✓ | ✓ | ✓ | ✗ | ✗ |
| View Reports | ✓ | ✓ | ✓ | ✗ | ✗ |
| List Inventory | ✓ | ✓ | ✓ | ✓ | ✓ |
| View Asset Detail | ✓ | ✓ | ✓ | ✓ | ✓ |
| Add Asset | ✓ | ✓ | ✗ | ✗ | ✗ |
| Edit Asset | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete Asset | ✓ | ✓ | ✗ | ✗ | ✗ |
| Manage Dropdowns | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create Ticket | ✓ | ✓ | ✗ | ✗ | ✗ |
| View Tickets | ✓ | ✓ | ✓ | ✓ | ✓ |
| Assign Team | ✓ | ✓ | ✗ | ✗ | ✗ |
| Update Status | ✓ | ✓ | ✓ | ✓ | ✓ |
| Add Work Notes | ✓ | ✓ | ✓ | ✓ | ✓ |
| Transfer Ticket | ✓ | ✓ | ✓ | ✓ | ✓ |
| Delete Ticket | ✓ | ✓ | ✗ | ✗ | ✗ |
| List Users | ✓ | ✗ | ✗ | ✗ | ✗ |
| Create User | ✓ | ✗ | ✗ | ✗ | ✗ |
| Edit User | ✓ | ✗ | ✗ | ✗ | ✗ |
| Change Role | ✓ | ✗ | ✗ | ✗ | ✗ |
| Reset Password | ✓ | ✗ | ✗ | ✗ | ✗ |
| Activate/Deactivate | ✓ | ✗ | ✗ | ✗ | ✗ |
| View Settings | ✓ | ✗ | ✗ | ✗ | ✗ |
| Update Settings | ✓ | ✗ | ✗ | ✗ | ✗ |

### 5.2 Security Headers

Applied globally in `app.js`:
| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Enable XSS filter |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Force HTTPS |

### 5.3 CORS Configuration

```javascript
// Production: allowlist from CORS_ORIGIN env var
// Development: localhost and 127.0.0.1 only
credentials: true,
methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
allowedHeaders: ["Content-Type", "Authorization"]
```

### 5.4 Input Validation & SQL Injection Prevention

| Layer | Mechanism | Coverage |
|-------|-----------|----------|
| SQL Queries | Parameterized queries (`@param` with `sql.NVarChar`, `sql.Int`, etc.) | All DB operations |
| Sort Columns | Whitelist validation (`ALLOWED_INVENTORY_SORT_COLUMNS`, etc.) | All ORDER BY clauses |
| API Input | express-validator chains with type/length/regex checks | All write endpoints |
| Pagination | `parsePagination()` with max page size 100 | All list endpoints |
| Asset ID | Server-generated SHA-256 hash (immutable) | All create operations |

### 5.5 Security Gap Analysis

| # | Gap | Severity | Recommendation |
|---|-----|----------|---------------|
| 1 | **No rate limiting on login** | HIGH | Add `express-rate-limit` to `/api/auth/login` (e.g., 5 attempts per 15 minutes) |
| 2 | **No audit log for inventory/user changes** | HIGH | Implement `audit_log` table (see Section 3.4) |
| 3 | **No encryption at rest for PII** | MEDIUM | Enable SQL Server TDE or column-level encryption for `serial_number`, `mac_address`, `ip_address`, `email` |
| 4 | **No password complexity policy** | MEDIUM | Enforce minimum 12 chars, uppercase, lowercase, digit, special char |
| 5 | **No password expiration/rotation** | MEDIUM | Add `password_changed_at` to users; enforce 90-day rotation |
| 6 | **No session management / token blacklist** | MEDIUM | Implement token revocation list for logout across devices |
| 7 | **Hard delete instead of soft delete** | MEDIUM | Add `deleted_at` timestamp to inventory and tickets; use soft delete |
| 8 | **No brute-force protection** | HIGH | Add account lockout after N failed attempts |
| 9 | **No CSRF protection** | LOW | Add CSRF token for state-changing operations |
| 10 | **No API versioning** | LOW | Prefix routes with `/api/v1/` for future compatibility |
| 11 | **No request logging / access logs** | MEDIUM | Add middleware to log all requests with IP, user-agent, response time |
| 12 | **Inconsistent bcrypt cost** | LOW | `create_admin.js` uses cost 12; `userService.js` uses cost 10. Standardize to 12. |
| 13 | **No SSO / OAuth integration** | MEDIUM | Support government SSO (e.g., LDAP/Active Directory, OAuth 2.0) |
| 14 | **No email notification system** | LOW | Integrate SMTP for ticket assignments, status changes, password resets |
| 15 | **Settings not persisted to database** | LOW | `settingsController.js` uses in-memory defaults; add `settings` table |

---

## 6. Business Logic & Workflows

### 6.1 Asset Lifecycle

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────┐
│  CREATE     │────▶│  ASSIGNED    │────▶│  IN MAINTENANCE│────▶│ RETIRED  │
│  (Add Asset)│     │  (Assigned)  │     │  (In Repair)   │     │ (Deleted)│
└─────────────┘     └──────────────┘     └───────────────┘     └──────────┘
                                                      │
                                              ┌───────▼───────┐
                                              │  AVAILABLE   │
                                              │  (Re-assigned)│
                                              └───────────────┘
```

**Asset ID Generation:**
- Algorithm: `ASSET-` + first 12 characters of SHA-256 hash of `(serial_number || mac_address)`
- Immutable: `asset_id` is excluded from update payloads (see `inventoryService.js:editAsset`)
- Deduplication: If hardware identifier already exists, returns existing asset instead of creating duplicate

### 6.2 Ticket Lifecycle

```
         ┌──────────────┐
         │    CREATE    │  (Admin / Help Desk only)
         │   [Open]     │
         └──────┬───────┘
                │
         ┌──────▼───────┐     ┌──────────────┐
         │  ASSIGN TO   │────▶│  IT Help     │
         │  IT Help Desk│     │  Desk        │
         └──────┬───────┘     └──────┬───────┘
                │                    │
         ┌──────▼───────┐     ┌──────▼───────┐
         │  START       │────▶│  In Progress │
         │  [In Progress]│    │              │
         └──────┬───────┘     └──────┬───────┘
                │                    │
         ┌──────▼───────┐     ┌──────▼───────┐
         │  PENDING     │◀────│  ADD WORK    │
         │              │     │  NOTES       │
         └──────┬───────┘     └──────────────┘
                │
         ┌──────▼───────┐     ┌──────────────┐
         │  RESOLVED    │────▶│  CLOSED      │
         │              │     │              │
         └──────────────┘     └──────────────┘

  TRANSFER (any team ↔ any team):
  IT Help Desk ↔ IT Team ↔ Network Team ↔ Cybersecurity Team
  (All roles can initiate transfer; logged in ticket_history)
```

### 6.3 User Management Workflow

```
Admin creates user → Password set (min 8 chars) → Account active by default
         │
         ├── Can change role (Admin only)
         ├── Can reset password (Admin only)
         ├── Can activate/deactivate (Admin only)
         └── Inactive users cannot log in (is_active = 0)
```

### 6.4 Dropdown Management

Dropdown values are sourced from two places:
1. **Database lookup table** (`lookup_values`) — admin-managed, persistent
2. **Distinct values from inventory data** — auto-populated from existing records

Users can add new dropdown values inline via `POST /api/inventory/dropdowns`, which stores them in `lookup_values` with auto-generated `code` (uppercase, spaces → underscores, non-alphanumeric → underscore, truncated to 50 chars).

### 6.5 Key Business Rules

| Rule | Implementation |
|------|---------------|
| Asset ID is immutable | `delete payloadSafe.asset_id` in `buildUpdateQuery()` |
| At least one hardware ID required | Service-level check: `if (!serial && !mac) throw 400` |
| Duplicate hardware detection | `findExistingByHardware()` checks serial AND mac |
| Hardware ID uniqueness on edit | Query checks for conflicts with other records |
| Sort column whitelist | `ALLOWED_INVENTORY_SORT_COLUMNS` array prevents SQL injection |
| Pagination max page size | `MAX_PAGE_SIZE = 100` in `pagination.js` |
| Ticket always starts at IT Help Desk | Hardcoded in `createTicket()`: `const assignedTeam = "IT Help Desk"` |
| Work notes accumulate | String concatenation with timestamp prefix in `addWorkNotes()` |
| Ticket delete cascades history | `DELETE FROM ticket_history WHERE ticket_id = @id` before deleting ticket |

---

## 7. Infrastructure & Deployment

### 7.1 Environment Configuration

**Backend `.env` (from `.env.example`):**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 5000 | HTTP server port |
| `NODE_ENV` | No | development | Environment (development/production) |
| `JWT_SECRET` | **Yes** | — | Secret for JWT signing (min 32 chars recommended) |
| `JWT_EXPIRES_IN` | No | 8h | JWT token expiration |
| `CORS_ORIGIN` | No | localhost:5173 | Comma-separated allowed origins |
| `DB_USER` | **Yes** | sa | SQL Server username |
| `DB_PASS` | **Yes** | — | SQL Server password |
| `DB_SERVER` | No | 127.0.0.1 | SQL Server hostname |
| `DB_NAME` | No | OfficeManagement | Database name |
| `DB_PORT` | No | 1433 | SQL Server port |
| `DB_ENCRYPT` | No | false | Enable TLS for DB connection |
| `DB_TRUST_CERT` | No | true | Skip certificate validation |

**Frontend `.env`:**
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:5000` | Backend API base URL |

### 7.2 Project Structure

```
Office-management-system-Government-node/
├── backend/
│   ├── app.js                          # Express entry point
│   ├── package.json
│   ├── config/
│   │   └── db.js                       # SQL Server connection pool
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── inventoryController.js
│   │   ├── reportsController.js
│   │   ├── settingsController.js
│   │   ├── ticketController.js
│   │   └── userController.js
│   ├── middlewares/
│   │   ├── auth.js                     # JWT verification
│   │   ├── rbac.js                     # Role-based access control
│   │   ├── validate.js                 # express-validator wrapper
│   │   └── errorHandler.js            # Global error handler
│   ├── models/
│   │   └── constants.js                # ROLES, TEAMS enums
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── reportsRoutes.js
│   │   ├── settingsRoutes.js
│   │   ├── ticketRoutes.js
│   │   └── userRoutes.js
│   ├── scripts/
│   │   ├── schema.sql                  # Full DB schema
│   │   ├── create_admin.js             # Admin account creation/reset
│   │   ├── seed.js                     # Sample data seeding
│   │   ├── test-all.cjs               # Integration tests
│   │   └── e2e-test.js                # E2E smoke tests
│   └── services/
│       ├── authService.js
│       ├── dashboardService.js
│       ├── inventoryService.js
│       ├── reportsService.js
│       ├── settingsService.js
│       ├── ticketService.js
│       └── userService.js
│   └── utils/
│       ├── ApiError.js
│       ├── asyncHandler.js
│       └── pagination.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── ProtectedRoute.jsx
│       │   └── ui/ (Button, Modal, Table, Badge, Select, FormInput, FormSection, AddDropdownItemModal)
│       ├── hooks/
│       │   └── useAuth.js
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── InventoryManagement.jsx
│       │   ├── TicketsList.jsx
│       │   ├── RaiseTicketForm.jsx
│       │   ├── UsersManagement.jsx
│       │   ├── Reports.jsx
│       │   ├── Settings.jsx
│       │   └── Login.jsx
│       └── services/
│           ├── api.js
│           ├── authService.js
│           ├── inventoryService.js
│           ├── ticketService.js
│           ├── reportsService.js
│           ├── settingsService.js
│           └── userService.js
└── docs/
    ├── SRS.md
    ├── BRD.md
    ├── Database_Schema.md
    ├── API_Documentation.md
    ├── Project_Charter.md
    └── ...
```

### 7.3 Build & Run Commands

**Backend:**
```bash
cd backend
npm install
npm run init-db        # Apply schema.sql
npm run seed           # Seed sample data
npm run dev            # Start development server (port 5000)
npm run start          # Start production server
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev            # Start dev server (port 5173)
npm run build          # Production build
npm run preview        # Preview production build
```

**Admin Account Management:**
```bash
# Create admin (first time)
cd backend
node scripts/create_admin.js

# Reset admin password (generates one-time password)
node scripts/create_admin.js --reset

# Set custom password
ADMIN_PASSWORD="YourSecurePass123!" node scripts/create_admin.js
```

### 7.4 Deployment Architecture

**Current (Development):**
- Backend: Node.js process on port 5000
- Frontend: Vite dev server on port 5173
- Database: SQL Server on localhost

**Recommended Production:**
```
                    ┌─────────────┐
                    │   Nginx     │  (reverse proxy, TLS termination)
                    │  :443 HTTPS │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
      ┌───────▼──────┐ ┌──▼────────┐ ┌─▼──────────┐
      │  Frontend    │ │  Backend  │ │  Backend    │
      │  (static     │ │  (API     │ │  (API       │
      │   files)     │ │   node:1) │ │   node:2)   │
      └──────────────┘ └────┬──────┘ └─────┬──────┘
                             │              │
                          ┌──▼──────────────▼──┐
                          │   SQL Server       │
                          │   (clustered)      │
                          └────────────────────┘
```

---

## 8. Future Enhancements

### 8.1 Short-Term (Priority 1 — Security Hardening)

| Enhancement | Description | Effort |
|------------|-------------|--------|
| Rate Limiting | Add `express-rate-limit` to login endpoint (5 attempts/15 min) and general API (100 req/min) | Low |
| Audit Logging | Implement `audit_log` table for all inventory and user management operations | Medium |
| Password Policy | Enforce 12+ chars, complexity requirements, store `password_changed_at` | Low |
| Soft Delete | Replace hard deletes with `deleted_at` timestamps on inventory and tickets | Medium |
| Consistent bcrypt | Standardize cost factor to 12 across all password operations | Low |

### 8.2 Medium-Term (Priority 2 — Compliance & Features)

| Enhancement | Description | Effort |
|------------|-------------|--------|
| Encryption at Rest | Enable SQL Server TDE or column-level encryption for sensitive fields | Medium |
| Email Notifications | Integrate Nodemailer for ticket assignments, status changes, password resets | Medium |
| CSV Import/Export | Enhance existing CSV import with validation, error reporting, and bulk operations | Low |
| Asset Transfer History | Track asset user/custodian changes with before/after snapshots | Medium |
| Report Export | Add PDF/Excel export for reports (current: CSV only on frontend) | Medium |
| Multi-language Support | i18n framework for government multi-language requirements | High |

### 8.3 Long-Term (Priority 3 — Enterprise Integration)

| Enhancement | Description | Effort |
|------------|-------------|--------|
| SSO / LDAP Integration | Connect to government Active Directory or LDAP for centralized auth | High |
| OAuth 2.0 / OIDC | Support standard identity providers | High |
| API Versioning | Migrate to `/api/v1/` prefix for backward compatibility | Medium |
| Webhook Integration | Event-driven notifications for external systems (SIEM, CMDB) | Medium |
| Real-time Updates | WebSocket/SSE for live ticket status changes and dashboard updates | Medium |
| File Attachments | Support document uploads on tickets and assets (with virus scanning) | High |
| Asset Barcode/QR | Generate and scan barcodes for physical asset tracking | Medium |
| Analytics Dashboard | Advanced charts, trend analysis, predictive maintenance alerts | High |
| RBAC Expansion | Support custom roles beyond the 5 fixed roles | High |
| Disaster Recovery | Automated backups, point-in-time recovery, DR runbook | Medium |
| Penetration Testing | Regular security assessments, OWASP Top 10 compliance audit | Ongoing |
| CI/CD Pipeline | Automated testing, build, and deployment with approval gates | High |

### 8.4 Government Compliance Checklist

| Requirement | Current Status | Target |
|------------|---------------|--------|
| OWASP Top 10 protections | Partial (security headers ✓, parameterized queries ✓, no rate limiting ✗) | Full compliance |
| Audit trail for data changes | ✗ (ticket history only) | Implement `audit_log` |
| Data encryption at rest | ✗ (plain text storage) | SQL Server TDE |
| Access logging | ✗ (no request logging) | Add middleware |
| Password complexity policy | ✗ (min 8 chars only) | 12+ chars, complexity |
| Session management | ✗ (stateless JWT only) | Token blacklist |
| Multi-factor authentication | ✗ | Implement TOTP/SMS |
| Data retention policy | ✗ | Define retention periods |
| Incident response | ✗ | Add incident reporting |
| Accessibility (WCAG 2.1) | Partial | Full compliance |

---

## Appendix A: Role Definitions

| Role | Description |
|------|-------------|
| **Admin** | Full system access — user management, asset CRUD, ticket management, settings |
| **Help Desk** | Front-line support — asset CRUD, ticket creation/assignment, user search |
| **IT Team** | Technical support — view assets/tickets, update status, add work notes, transfer tickets |
| **Network Team** | Network-focused support — same access as IT Team |
| **Cybersecurity** | Security-focused support — same access as IT Team |

## Appendix B: Ticket Status Definitions

| Status | Description |
|--------|-------------|
| **Open** | Ticket created, awaiting assignment or initial triage |
| **In Progress** | Actively being worked on by assigned team |
| **Pending** | Waiting on external input (user response, part delivery, etc.) |
| **Resolved** | Issue addressed, awaiting user confirmation |
| **Closed** | Ticket finalized and completed |

## Appendix C: Asset Status Definitions

| Status | Description |
|--------|-------------|
| **Available** | Asset is in stock, ready for assignment |
| **Assigned** | Asset is currently in use by an authorized user |
| **In Maintenance** | Asset is undergoing repair or servicing |
| **Retired** | Asset has been decommissioned |
| **Lost** | Asset is unaccounted for |
| **Damaged** | Asset is damaged and needs assessment |

---

*Document End — System Design Document v1.0.0*
