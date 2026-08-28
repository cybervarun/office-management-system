# API Documentation

**Version:** 1.0.0
**Date:** 2026-08-24
**Base URL:** `http://localhost:5000/api`

---

## Authentication

All endpoints except `POST /api/auth/login` require a valid JWT Bearer token.

**Header:**
```
Authorization: Bearer <token>
```

**Token Payload:**
```json
{
  "id": 1,
  "email": "admin@local",
  "role": "Admin",
  "name": "Administrator",
  "iat": 1723600000,
  "exp": 1723628800
}
```

---

## Error Response Format

```json
{
  "error": "Human-readable error message"
}
```

Validation errors include additional detail:
```json
{
  "error": "Validation failed",
  "details": [
    { "type": "field", "value": "...", "msg": "Valid email is required", "path": "email", "location": "body" }
  ]
}
```

---

## Common Pagination Parameters

All list endpoints accept these query parameters:

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | integer | 1 | — | Page number (1-based) |
| `pageSize` | integer | 20 | 100 | Records per page |
| `sortBy` | string | `created_at` | — | Sort column (alphanumeric + underscore) |
| `sortDirection` | string | `DESC` | — | `ASC` or `DESC` |

**Response envelope:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 1. Authentication

### 1.1 Login

**POST** `/api/auth/login`

Public endpoint. Returns JWT token and user profile.

**Request Body:**
```json
{
  "email": "admin@local",
  "password": "YOUR_ADMIN_PASSWORD_HERE"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Administrator",
    "email": "admin@local",
    "role": "Admin"
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| 400 | Missing or invalid email/password |
| 401 | Invalid credentials |
| 403 | User account is inactive |

---

## 2. Users (Admin Only)

### 2.1 List Users

**GET** `/api/users`

**Authorization:** Admin

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Filter by name/email/phone |
| `role` | string | Filter by role |
| `is_active` | string | Filter by active status ("true"/"false") |
| (pagination params) | — | See Common Pagination Parameters |

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Administrator",
      "email": "admin@local",
      "phone": "+91-9876543210",
      "role": "Admin",
      "is_active": true,
      "created_at": "2025-05-06T10:00:00.000Z",
      "updated_at": "2025-05-06T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### 2.2 Create User

**POST** `/api/users`

**Authorization:** Admin

**Request Body:**
```json
{
  "name": "Rahul Sharma",
  "email": "rahul.sharma@office.gov.in",
  "phone": "+91-9876543210",
  "role": "IT Team",
  "password": "YOUR_ADMIN_PASSWORD_HERE"
}
```

**Validation Rules:**
- `name`: required, non-empty
- `email`: required, valid email format
- `phone`: optional, string
- `role`: required, must be one of `Admin`, `Help Desk`, `IT Team`, `Network Team`, `Cybersecurity`
- `password`: required, minimum 8 characters

**Success Response (201):**
```json
{
  "id": 2,
  "name": "Rahul Sharma",
  "email": "rahul.sharma@office.gov.in",
  "phone": "+91-9876543210",
  "role": "IT Team",
  "is_active": true,
  "created_at": "2025-07-28T12:00:00.000Z",
  "updated_at": "2025-07-28T12:00:00.000Z"
}
```

### 2.3 Update Role

**PATCH** `/api/users/:id/role`

**Authorization:** Admin

**Request Body:**
```json
{ "role": "Help Desk" }
```

**Success Response (200):** Updated user object.

### 2.4 Update Password

**PATCH** `/api/users/:id/password`

**Authorization:** Admin

**Request Body:**
```json
{ "password": "newSecurePassword123" }
```

**Validation:** Password minimum 8 characters.

**Success Response (200):** `{ "message": "Password updated successfully" }`

### 2.5 Activate User

**PATCH** `/api/users/:id/activate`

**Authorization:** Admin

**Success Response (200):** Updated user object with `is_active: true`.

### 2.6 Deactivate User

**PATCH** `/api/users/:id/deactivate`

**Authorization:** Admin

**Success Response (200):** Updated user object with `is_active: false`.

### 2.7 Search Users

**GET** `/api/users/search?q=raman`

**Authorization:** All authenticated roles

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search term (matched against name, email, phone) |

**Success Response (200):**
```json
[
  {
    "id": 1,
    "name": "Raman Kumar",
    "email": "raman.kumar@office.gov.in",
    "role": "IT Team",
    "is_active": true
  }
]
```

---

## 3. Inventory

### 3.1 List Assets

**GET** `/api/inventory`

**Authorization:** All authenticated roles

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Full-text search across asset fields |
| `ministry` | string | Filter by ministry |
| `department` | string | Filter by department |
| `asset_category` | string | Filter by asset category |
| `asset_current_status` | string | Filter by current status |
| `edr_installed` | string | Filter by EDR installation status |
| `uem_installed` | string | Filter by UEM installation status |
| (pagination params) | — | See Common Pagination Parameters |

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "sr_no": 1,
      "ministry": "Ministry of Electronics",
      "department": "IT Department",
      "mdo_location": "Delhi",
      "division": "Division A",
      "asset_id": "a1b2c3d4",
      "serial_number": "SN12345678",
      "asset_category": "Laptop",
      "block_name": "Block A",
      "floor": "2",
      "room": "204",
      "workstation": "WS-204-01",
      "asset_description": "Dell Latitude 5520",
      "make_brand_model": "Dell Latitude 5520",
      "purchase_date": "2024-01-15",
      "operating_system": "Windows 11",
      "ip_address": "192.168.1.100",
      "mac_address": "AA:BB:CC:DD:EE:FF",
      "network_connection_type": "Wired",
      "edr_installed": "Yes",
      "asset_user": "Raman Kumar",
      "asset_custodian": "Help Desk",
      "asset_current_status": "In Use",
      "installation_date": "2024-01-20",
      "end_of_support_date": "2027-01-15",
      "end_of_life_date": "2029-01-15",
      "amc_warranty_expiry_date": "2027-01-15",
      "critical": "Yes",
      "remarks": "",
      "created_at": "2025-05-10T08:00:00.000Z",
      "updated_at": "2025-07-28T10:30:00.000Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 1, "totalPages": 1 }
}
```

### 3.2 Add Asset

**POST** `/api/inventory`

**Authorization:** Admin, Help Desk

**Request Body:**
```json
{
  "ministry": "Ministry of Electronics",
  "department": "IT Department",
  "mdo_location": "Delhi",
  "division": "Division A",
  "serial_number": "SN12345678",
  "asset_category": "Laptop",
  "block_name": "Block A",
  "floor": "2",
  "room": "204",
  "workstation": "WS-204-01",
  "asset_description": "Dell Latitude 5520",
  "make_brand_model": "Dell Latitude 5520",
  "purchase_date": "2024-01-15",
  "operating_system": "Windows 11",
  "ip_address": "192.168.1.100",
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "network_connection_type": "Wired",
  "edr_installed": "Yes",
  "uem_installed": "Yes",
  "asset_user": "Raman Kumar",
  "asset_custodian": "Help Desk",
  "asset_current_status": "In Use",
  "installation_date": "2024-01-20",
  "end_of_support_date": "2027-01-15",
  "end_of_life_date": "2029-01-15",
  "amc_warranty_expiry_date": "2027-01-15",
  "critical": "Yes",
  "remarks": ""
}
```

**Validation Rules:**
- `ministry`, `department`, `asset_category`, `asset_description`, `asset_user`, `asset_custodian`, `asset_current_status`: required
- At least one of `serial_number` or `mac_address`: required (for Asset ID generation)
- `mac_address`: must match `^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$`
- `ip_address`: must match IPv4 dotted-quad format
- Date fields: ISO 8601 format if provided

**Success Response (201):**
```json
{
  "id": 2,
  "asset_id": "a1b2c3d4",
  "sr_no": 2,
  ...
}
```

**Duplicate Response (200):**
```json
{ "message": "Asset already exists", "asset": { ... } }
```

### 3.3 Edit Asset

**PUT** `/api/inventory/:id`

**Authorization:** Admin, Help Desk

Same request body as Add Asset. `asset_id` is ignored on update (preserved from existing record).

**Success Response (200):** Updated asset object.

### 3.4 Get Dropdowns

**GET** `/api/inventory/dropdowns`

**Authorization:** All authenticated roles

**Success Response (200):**
```json
{
  "ministry": ["Ministry of Electronics", "Ministry of Home Affairs"],
  "department": ["IT Department", "Accounts"],
  "asset_category": ["Laptop", "Desktop", "Printer"],
  "operating_system": ["Windows 11", "Windows 10"],
  "network_connection_type": ["Wired", "Wireless"]
}
```

### 3.5 Add Dropdown Value

**POST** `/api/inventory/dropdowns`

**Authorization:** All authenticated roles

**Request Body:**
```json
{
  "field": "ministry",
  "value": "Ministry of Statistics"
}
```

**Allowed Fields:** `ministry`, `department`, `asset_category`, `operating_system`, `network_connection_type`

**Success Response (201):**
```json
{
  "id": 10,
  "value": "Ministry of Statistics",
  "code": "MINISTRY_OF_STATISTICS"
}
```

### 3.6 Search User Inventory

**GET** `/api/inventory/search-user?q=raman`

**Authorization:** All authenticated roles

**Success Response (200):**
```json
[
  {
    "id": 1,
    "asset_id": "a1b2c3d4",
    "asset_user": "Raman Kumar",
    "asset_description": "Dell Latitude 5520",
    ...
  }
]
```
Returns top 25 matching records ordered by `updated_at DESC`.

---

## 4. Tickets

### 4.1 List Tickets

**GET** `/api/tickets`

**Authorization:** All authenticated roles

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search title and description |
| `status` | string | Filter by status |
| `assigned_team` | string | Filter by team |
| (pagination params) | — | See Common Pagination Parameters |

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Printer not working",
      "description": "HP LaserJet showing error code P2",
      "status": "Open",
      "created_by": 1,
      "created_by_name": "Raman Kumar",
      "assigned_team": "IT Help Desk",
      "inventory_id": null,
      "work_notes": "",
      "created_at": "2025-07-28T10:00:00.000Z",
      "updated_at": "2025-07-28T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 1, "totalPages": 1 }
}
```

### 4.2 Get Ticket

**GET** `/api/tickets/:id`

**Authorization:** All authenticated roles

**Success Response (200):** Ticket object (same shape as list items) with full `work_notes` content.

### 4.3 Create Ticket

**POST** `/api/tickets`

**Authorization:** Admin, Help Desk

**Request Body:**
```json
{
  "title": "Printer not working",
  "description": "HP LaserJet showing error code P2 on 2nd floor",
  "inventory_id": 5
}
```

**Validation:** `title` and `description` required. `inventory_id` optional integer.

**Success Response (201):**
```json
{
  "id": 1,
  "title": "Printer not working",
  "description": "HP LaserJet showing error code P2 on 2nd floor",
  "status": "Open",
  "created_by": 1,
  "created_by_name": "Raman Kumar",
  "assigned_team": "IT Help Desk",
  "inventory_id": 5,
  "work_notes": "",
  "created_at": "2025-07-28T10:00:00.000Z",
  "updated_at": "2025-07-28T10:00:00.000Z"
}
```

### 4.4 Assign Ticket to Team

**PATCH** `/api/tickets/:id/assign`

**Authorization:** Admin, Help Desk

**Request Body:**
```json
{
  "toTeam": "IT Team",
  "note": "Escalating to hardware team"
}
```

**Allowed Teams:** `IT Help Desk`, `IT Team`, `Network Team`, `Cybersecurity Team`

**Success Response (200):** Updated ticket with audit history entry.

### 4.5 Update Ticket Status

**PATCH** `/api/tickets/:id/status`

**Authorization:** All authenticated roles

**Request Body:**
```json
{ "status": "In Progress" }
```

**Allowed Statuses:** `Open`, `In Progress`, `Pending`, `Resolved`, `Closed`

**Success Response (200):** Updated ticket.

### 4.6 Add Work Note

**PATCH** `/api/tickets/:id/work-notes`

**Authorization:** All authenticated roles

**Request Body:**
```json
{ "workNotes": "Replaced toner cartridge. Printer tested OK." }
```

**Success Response (200):** Updated ticket with appended work note.

### 4.7 Transfer Ticket

**POST** `/api/tickets/transfer`

**Authorization:** All authenticated roles

**Request Body:**
```json
{
  "ticketId": 1,
  "toTeam": "Network Team",
  "note": "Network-related issue, transferring"
}
```

**Success Response (200):** Updated ticket.

---

## 5. Health Check

### 5.1 Health

**GET** `/health`

Public endpoint. No authentication required.

**Success Response (200):**
```json
{ "ok": true }
```

---

## 6. Status Codes Reference

| Code | Meaning | Typical Cause |
|------|---------|---------------|
| 200 | OK | Successful GET/PATCH/PUT |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation failure, invalid enum value |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Valid token but insufficient role |
| 404 | Not Found | Resource ID does not exist |
| 409 | Conflict | Duplicate serial_number or mac_address |
| 404 | Route Not Found | Unknown endpoint path |
| 500 | Internal Server Error | Unhandled server error |
