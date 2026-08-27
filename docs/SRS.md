# Software Requirements Specification (SRS)

**Version:** 1.0.0
**Date:** 2026-08-24

---

## 1. System Overview

The IT Inventory & Ticketing System is a two-tier web application for managing government office IT assets and support tickets. It consists of a React SPA frontend and a Node.js/Express REST API backend backed by Microsoft SQL Server.

---

## 2. Architecture

### 2.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER (React SPA)                 │
│  Login │ Dashboard │ Inventory │ Tickets │ Users │ ...  │
└──────────────────────┬──────────────────────────────────┘
                       │ Axios + Bearer Token
                       ▼
┌─────────────────────────────────────────────────────────┐
│               Express.js API Server (:5000)              │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │  auth    │  │  users   │  │ inventory│  │tickets │  │
│  │ routes   │  │ routes   │  │  routes  │  │routes  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
│       │             │             │             │        │
│  ┌────▼─────┐  ┌────▼─────┐  ┌───▼─────┐  ┌───▼────┐   │
│  │controllers│ │controllers│ │controls. │  │controls.│   │
│  └────┬─────┘  └────┬─────┘  └───┬─────┘  └───┬────┘   │
│       │             │             │             │        │
│  ┌────▼─────┐  ┌────▼─────┐  ┌───▼─────┐  ┌───▼────┐   │
│  │services  │  │services  │  │services │  │services│   │
│  └────┬─────┘  └────┬─────┘  └───┬─────┘  └───┬────┘   │
│       │             │             │             │        │
│  ┌────▼─────────────▼─────────────▼─────────────▼────┐   │
│  │          mssql.ConnectionPool (shared)             │   │
│  └────────────────────┬──────────────────────────────┘   │
└───────────────────────┼──────────────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │ MS SQL Server    │
              │ OfficeManagement │
              └──────────────────┘
```

### 2.2 Layering Pattern

Every domain follows a strict 4-layer pattern:

```
routes  →  controllers  →  services  →  DB (mssql pool)
   │          │               │
validator  thin            raw SQL
middleware handler         params
```

- **Routes**: Define HTTP method, path, auth/RBAC guards, express-validator chains, and delegate to controller.
- **Controllers**: Parse `req.body`/`req.params`, call service, return `res.json()`. No business logic.
- **Services**: All business rules, DB queries, error throwing (`ApiError`). Pure async functions.
- **DB**: Shared `mssql.ConnectionPool` with parameterized queries via `executeQuery(query, params)`.

### 2.3 Middleware Stack (per request)

```
Security Headers → CORS → JSON Parse → Route Auth → RBAC → Validation → Controller
```

---

## 3. Technology Stack

### 3.1 Backend

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.19.2 | Web framework |
| mssql | ^12.5.2 | SQL Server driver |
| jsonwebtoken | ^9.0.2 | JWT sign/verify |
| bcryptjs | ^2.4.3 | Password hashing |
| express-validator | ^7.1.0 | Request validation |
| cors | ^2.8.5 | CORS handling |
| dotenv | ^16.4.5 | Environment variables |
| nodemon | ^3.1.4 | Dev hot reload |

### 3.2 Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.3.1 | UI library |
| react-dom | ^18.3.1 | React DOM renderer |
| react-router-dom | ^6.26.0 | Client-side routing |
| axios | ^1.7.2 | HTTP client |
| react-icons | ^5.6.0 | Icon library (Feather Icons) |
| vite | ^7.3.3 | Build tool & dev server |
| @vitejs/plugin-react | ^4.3.1 | JSX support |

### 3.3 Database

| Item | Value |
|------|-------|
| Engine | Microsoft SQL Server |
| Database | OfficeManagement |
| Default Port | 1433 |
| Connection Pool | Configurable (default max: 10) |

---

## 4. Component Specifications

### 4.1 Authentication Module

**Flow:**
1. Client POSTs `{ email, password }` to `/api/auth/login`
2. `authService.login()` queries `users` table by email
3. Compares password hash with bcrypt
4. Signs JWT with `{ id, email, role, name }` and `JWT_SECRET`
5. Returns `{ token, user }` to client
6. Client stores in `localStorage` (`token`, `user`)
7. All subsequent requests include `Authorization: Bearer <token>`

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

### 4.2 Role-Based Access Control

**Roles** (from `backend/models/constants.js`):

| Role | Inventory Read | Inventory Write | User Mgmt | Ticket Create | Ticket Update |
|------|---------------|-----------------|-----------|---------------|---------------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Help Desk | ✅ | ✅ | ❌ | ✅ | ✅ |
| IT Team | ✅ | ❌ | ❌ | ✅ | ✅ |
| Network Team | ✅ | ❌ | ❌ | ✅ | ✅ |
| Cybersecurity | ✅ | ❌ | ❌ | ✅ | ✅ |

**Teams** (ticket assignment):

| Team | Description |
|------|-----------|
| IT Help Desk | First-line support, ticket triage |
| IT Team | Hardware/software troubleshooting |
| Network Team | Network connectivity issues |
| Cybersecurity Team | Security incidents |

### 4.3 Asset ID Generation

When `serial_number` or `mac_address` is provided:

```
Asset ID = first 8 chars of SHA-256 hash of source string (serial or MAC)
```

Example:
```
serial_number = "SN12345678"
→ SHA-256("SN12345678") = "a1b2c3d4..."
→ asset_id = "a1b2c3d4"
```

If both provided, `serial_number` takes precedence.

### 4.4 Pagination System

**Parser** (`backend/utils/pagination.js`):
- `page` (default: 1), `pageSize` (default: 20, max: 100)
- `offset = (page - 1) * pageSize`
- `sortBy` validated against regex `^[a-zA-Z_][a-zA-Z0-9_]*$`
- `sortDirection`: "ASC" or "DESC"

**SQL Pattern:**
```sql
SELECT ... FROM ... WHERE ... 
ORDER BY @sortBy @sortDirection
OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY

-- Total count via window function:
SELECT ..., COUNT(*) OVER() as _totalCount FROM ...
```

**Response Envelope:**
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

### 4.5 Error Handling

**Backend:**
- `ApiError(statusCode, message)` — custom error class
- `asyncHandler(fn)` — wraps async controllers, catches rejections
- Global error handler middleware returns `{ error: message }`
- Validation errors return `{ error: "Validation failed", details: [...] }`

**Frontend:**
- Axios interceptor attaches bearer token
- Error responses display `err.response.data.error` or first validation message

---

## 5. Data Flow

### 5.1 Login Flow
```
Login.jsx → authService.login(email, pwd)
  → POST /api/auth/login
  → authController → authService.login()
  → DB: SELECT users WHERE email
  → bcrypt.compare()
  → jwt.sign()
  → Return { token, user }
  → useAuth.login(token, user) → localStorage
  → App.jsx renders ProtectedRoute + Layout
```

### 5.2 Add Asset Flow
```
InventoryManagement.jsx → addInventory(payload)
  → POST /api/inventory
  → auth middleware → rbac(["Admin", "Help Desk"])
  → express-validator (inventoryValidators)
  → inventoryController.addAsset()
  → inventoryService.addAsset(payload)
  → DB: INSERT INTO inventory (with asset_id generation)
  → Return created asset
```

### 5.3 Ticket Status Update Flow
```
TicketsList.jsx → updateTicketStatus(id, status)
  → PATCH /api/tickets/:id/status
  → auth → rbac(all roles)
  → express-validator (status enum check)
  → ticketController.updateStatus()
  → ticketService.updateStatus(id, status, userId)
  → DB: UPDATE tickets SET status
  → DB: INSERT INTO ticket_history (audit log)
  → Return updated ticket
```

---

## 6. Configuration

### 6.1 Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_USER` / `SA_USER` | No | `sa` | SQL Server login |
| `DB_PASS` / `SA_PASSWORD` / `MSSQL_SA_PASSWORD` | **Yes** | — | SQL Server password |
| `DB_SERVER` | No | `127.0.0.1` | SQL Server hostname |
| `DB_NAME` / `MSSQL_DB` | No | `OfficeManagement` | Database name |
| `DB_PORT` | No | `1433` | SQL Server port |
| `DB_ENCRYPT` | No | `false` | Enable TLS encryption |
| `DB_TRUST_CERT` | No | `true` | Skip cert validation |
| `DB_POOL_MAX` | No | `10` | Max pool connections |
| `DB_POOL_MIN` | No | `0` | Min pool connections |
| `DB_POOL_TIMEOUT` | No | `30000` | Idle timeout ms |
| `JWT_SECRET` | **Yes** | — | JWT signing secret |
| `JWT_EXPIRES_IN` | No | `8h` | Token expiry |
| `PORT` | No | `5000` | HTTP server port |
| `CORS_ORIGIN` | No | — | Comma-separated allowed origins (production only) |

### 6.2 Frontend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:5000` | Backend API base URL |

### 6.3 Admin Seeding

```bash
# Set password via env var (≥ 12 chars)
ADMIN_PASSWORD=yourSecurePassword123 node scripts/create_admin.js

# Or generate one-time password
node scripts/create_admin.js -- --reset
```

---

## 7. Security Measures

| Measure | Implementation |
|---------|---------------|
| Password hashing | bcryptjs, 10 rounds |
| Auth tokens | JWT with server-side secret, 8h expiry |
| SQL injection | Parameterized queries via `mssql` `request.input()` |
| XSS | React JSX auto-escaping + `X-XSS-Protection` header |
| Clickjacking | `X-Frame-Options: DENY` |
| MIME sniffing | `X-Content-Type-Options: nosniff` |
| HSTS | `Strict-Transport-Security: max-age=31536000` |
| CORS | Origin allowlist in production; localhost-only in dev |
| Input validation | express-validator chains on all write endpoints |
| RBAC | `allowRoles()` middleware on all protected routes |
| Asset ID collision | SHA-256 based, first 8 chars; DB UNIQUE constraint on serial/MAC |

---

## 8. Known Limitations

| # | Limitation | Impact |
|---|-----------|--------|
| 1 | No password reset flow | Admin must manually reset via API |
| 2 | No email notifications | Users not notified of ticket updates |
| 3 | Reports page is a stub | Analytics not yet implemented |
| 4 | Settings page is a stub | No UI for system configuration |
| 5 | No rate limiting | Auth endpoint vulnerable to brute force |
| 6 | No soft delete | Assets/tickets cannot be recovered after deletion |
| 7 | Error details leaked | Internal error messages returned to client |
| 8 | Single-tenant only | No multi-office support |
