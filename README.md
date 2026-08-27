# IT Inventory & Ticketing System

Government office IT asset lifecycle management and help-desk ticketing platform.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 · Vite 7 · React Router v7 · Axios |
| **Backend** | Node.js 18+ · Express 4 · `pg` (PostgreSQL driver) |
| **Database** | PostgreSQL 14+ |
| **Auth** | JWT (8h expiry) · bcryptjs v3 (10 rounds) |
| **Testing** | Jest · Supertest · Playwright · Puppeteer |
| **Security** | RBAC (5 roles) · Parameterized queries · Security headers · CORS |

---

## Project Structure

```
├── backend/                # Node.js/Express API
│   ├── app.js              # Entry point — middleware stack, routes
│   ├── config/
│   │   └── db.js           # pg pool + executeQuery / executeTransaction
│   ├── controllers/        # Thin controllers (extract input, call service, respond)
│   ├── middlewares/
│   │   ├── auth.js         # JWT verify
│   │   └── rbac.js         # allowRoles(...) gate
│   ├── routes/             # Express routers (auth, users, inventory, tickets, dashboard, reports, settings)
│   ├── scripts/            # DB migration, seed, test scripts
│   ├── services/           # Business logic layer
│   └── utils/              # ApiError, pagination helper
├── frontend/               # React 18 + Vite 7 SPA
│   ├── src/
│   │   ├── App.jsx         # Route definitions
│   │   ├── components/     # Layout, ProtectedRoute, ui/
│   │   ├── hooks/          # useAuth
│   │   ├── pages/          # Dashboard, InventoryManagement, TicketsList, UsersManagement, Reports, Settings, Login, RaiseTicketForm
│   │   ├── services/       # API client wrappers (axios)
│   │   └── utils/
│   └── vite.config.js
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md     # System architecture, middleware stack, security
│   ├── DATA_MODEL.md       # PostgreSQL schema reference (5 tables)
│   ├── PostgreSQL_Schema_DDL.sql  # Authoritative DDL — run to create DB
│   ├── Local_Host_Setup_Guide.md  # Step-by-step local setup
│   ├── API_Documentation.md    # REST API reference
│   ├── BRD.md              # Business Requirements Document
│   ├── Project_Charter.md  # Project charter
│   ├── User_Admin_Guide.md # End-user and admin guide (PostgreSQL)
│   ├── CHANGELOG.md        # Full change history
│   ├── PRD_v2.md           # Master product requirements
│   ├── FLOWS/              # User flows, gap reports, PRD validation
│   └── security/           # RBAC audit report
├── tests/                  # Integration + RBAC test suites
├── jest.config.js          # Jest configuration
├── jest-setup.js           # Jest setup (DB stubs)
└── package.json            # Root dev dependencies
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Git

### 1. Clone & Install

```bash
git clone <repo-url>
cd Office-management-system-Government-node
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Set Up Database

```bash
# Create the database
createdb -U postgres -h localhost office_management

# Apply schema (tables, indexes, constraints, seed data)
cd backend && npm run migrate-pg
```

### 3. Configure Environment

Create `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=office_management
DB_USER=postgres
DB_PASSWORD=your-postgres-password
DB_POOL_MAX=20
DB_POOL_TIMEOUT=10000
DB_CONNECTION_TIMEOUT=5000
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

### 4. Create Admin User

```bash
cd backend && npm run seed-admin
```

### 5. Start the App

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
```

Open **http://localhost:5173** and log in with the admin credentials.

---

## Available Scripts

| Script | Location | Purpose |
|--------|----------|---------|
| `npm run dev` | backend | Start backend with nodemon hot reload (:5000) |
| `npm run prod` | backend | Production mode (`NODE_ENV=production`) |
| `npm run migrate-pg` | backend | Apply PostgreSQL schema DDL |
| `npm run rollback-pg` | backend | Drop all app tables (⚠️ deletes data) |
| `npm run seed-admin` | backend | Create/update admin account |
| `npm run test-db` | backend | Test PostgreSQL connectivity |
| `npm run test` | root | Run Jest test suite (242 tests) |
| `npm run test:integration` | root | Run integration tests sequentially |
| `npm run dev` | frontend | Start Vite dev server (:5173) |
| `npm run build` | frontend | Production build → `frontend/dist/` |

---

## Roles & Permissions

| Role | Inventory View | Inventory Edit | User Mgmt | Ticket Create | Ticket Update |
|------|:---:|:---:|:---:|:---:|:---:|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Help Desk | ✅ | ✅ | ❌ | ✅ | ✅ |
| IT Team | ✅ | ❌ | ❌ | ✅ | ✅ |
| Network Team | ✅ | ❌ | ❌ | ✅ | ✅ |
| Cybersecurity | ✅ | ❌ | ❌ | ✅ | ✅ |

See `docs/ARCHITECTURE.md` for the full RBAC matrix and `docs/security/RBAC_AUDIT.md` for the security audit.

---

## Database

5 tables: `users`, `inventory` (47 columns), `tickets`, `ticket_history`, `lookup_values`

Asset ID = first 8 lowercase hex characters of `SHA-256(serial_number || mac_address)`.

See `docs/PostgreSQL_Schema_DDL.sql` for the authoritative schema and `docs/DATA_MODEL.md` for the data model reference.

---

## Testing

```bash
# Run all tests
npm test

# Run integration tests sequentially (required for DB isolation)
npm run test:integration
```

Current: **242/242** integration tests passing · **94/94** RBAC tests passing.

---

## Documentation

| Document | Purpose |
|----------|---------|
| `docs/ARCHITECTURE.md` | System architecture, middleware stack, security |
| `docs/DATA_MODEL.md` | PostgreSQL schema reference |
| `docs/PostgreSQL_Schema_DDL.sql` | Authoritative DDL — create the database |
| `docs/Local_Host_Setup_Guide.md` | Step-by-step local setup |
| `docs/API_Documentation.md` | REST API reference |
| `docs/User_Admin_Guide.md` | End-user and admin guide |
| `docs/BRD.md` | Business Requirements Document |
| `docs/Project_Charter.md` | Project charter |
| `docs/CHANGELOG.md` | Full change history |
| `docs/PRD_v2.md` | Master product requirements |
| `docs/FLOWS/user-flows.md` | 8 user flows with Mermaid diagrams |
| `docs/FLOWS/UI_GAP_REPORT.md` | 7 open UI gaps tracked |
| `docs/FLOWS/PRD_VALIDATION_REPORT.md` | PRD coverage: 20/29 criteria met |
| `docs/security/RBAC_AUDIT.md` | RBAC security audit (11 findings) |

---

## Security

- All SQL queries are parameterized (`$1`, `$2` positional params) — no string concatenation
- JWT tokens expire after 8 hours
- Passwords hashed with bcryptjs (10 rounds)
- RBAC enforced via `allowRoles()` middleware on every protected route
- Security headers (HSTS, X-Frame-Options, nosniff) on every response
- CORS restricted to configured origins in production

See `docs/security/RBAC_AUDIT.md` for open findings and recommendations.

---

*Last updated: 2026-08-27 · PostgreSQL migration complete · 242/242 tests passing*
