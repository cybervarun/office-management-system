# Project Charter

## IT Inventory & Ticketing System — Government Office

**Version:** 2.0.0
**Date:** 2026-08-27
**Status:** Production-Ready (MVP) — PostgreSQL migration complete

---

## 1. Project Overview

### 1.1 Background

Government offices manage thousands of IT assets (computers, printers, peripherals) and handle hundreds of support tickets monthly. Legacy spreadsheet-based tracking leads to duplication, stale records, and slow ticket resolution. This system digitizes and centralizes both functions in a single role-based platform.

### 1.2 Objectives

| # | Objective |
|---|-----------|
| 1 | Digitize IT asset lifecycle — from procurement to disposal |
| 2 | Centralize help-desk ticketing with team-based assignment |
| 3 | Enforce role-based access control across five organizational tiers |
| 4 | Provide audit trails for all ticket state changes |
| 5 | Generate structured inventory reports for compliance |

### 1.3 Scope

**In Scope:**

- User authentication (JWT) and role-based authorization
- Full CRUD for IT inventory with government-standard field set (ministry, department, asset ID, lifecycle dates)
- Ticket creation, status tracking, team assignment, and work-note logging
- User management (create, role edit, password reset, activate/deactivate)
- Server-side pagination and filtering across all list endpoints
- Dropdown value management (ministry, department, asset category, etc.)
- CSV import/export for inventory bulk operations
- Asset ID auto-generation from serial number or MAC address

**Out of Scope (v1):**

- SLA enforcement and escalation rules
- Automated email/SMS notifications
- Document attachment upload
- Mobile application
- Multi-tenancy
- Real-time WebSocket updates

---

## 2. Stakeholders

| Role | Responsibility |
|------|---------------|
| **IT Admin** | System configuration, user management, schema seeding |
| **Help Desk Staff** | Create/manage tickets, manage inventory records |
| **IT Team** | Resolve assigned tickets, update asset status |
| **Network Team** | Resolve network-related tickets |
| **Cybersecurity Team** | Resolve security-related tickets |
| **Office Management** | Read-only access for reporting and asset lookup |

---

## 3. Success Metrics

| Metric | Target |
|--------|--------|
| Asset record accuracy | ≥ 98% (no duplicate serial/MAC) |
| Ticket resolution time (Open → Resolved) | ≤ 48 hours for priority-1 |
| System uptime | ≥ 99.5% (business hours) |
| Authentication failure rate | < 0.1% of login attempts |
| API response p95 | < 500 ms for list endpoints |
| User onboarding time | < 5 minutes per new user |

---

## 4. Technical Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 7 + React Router 6 |
| Backend | Node.js 18 + Express 4 |
| Database | PostgreSQL 14+ (office_management) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | express-validator |
| HTTP Client | Axios |

---

## 5. Repository Structure

```
Office-management-system-Government-node/
├── backend/
│   ├── app.js                  # Express entry point
│   ├── config/
│   │   └── db.js              # PostgreSQL connection pool
│   ├── controllers/           # Thin request handlers
│   ├── middlewares/           # auth, rbac, validate, error handler
│   ├── utils/constants.js     # ROLES, TEAMS enums
│   ├── routes/                # Express routers per domain
│   ├── scripts/
│   │   ├── migrate_to_postgres.js  # Schema migration runner
│   │   ├── apply_schema.js    # Migration runner
│   │   └── create_admin.js    # Seed script
│   ├── services/              # Business logic + DB queries
│   └── utils/                 # ApiError, asyncHandler, pagination
├── frontend/
│   ├── src/
│   │   ├── components/        # Layout, UI primitives
│   │   ├── hooks/             # useAuth
│   │   ├── pages/             # Route-level screens
│   │   ├── services/          # API client wrappers
│   │   └── utils/             # roles.js
│   └── vite.config.js
└── docs/                      # Project documentation
```

---

## 6. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| SQL injection via unsanitized input | High | All queries use parameterized `$1, $2` positional params via `pg` |
| JWT secret exposure | High | Stored in `.env`, never committed |
| Concurrent asset insert duplicate | Medium | Backend uniqueness check on serial/MAC before insert |
| No rate limiting on auth endpoint | Medium | Add in v2; currently not exploited in intranet |
| Reports page unimplemented | Low | Stub page exists; to be filled post-v1 |
