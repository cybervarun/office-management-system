# Product Requirements Document (PRD)

**Product:** IT Asset & Ticket Management System
**Version:** 2.0.0
**Date:** 2026-08-25
**Target Audience:** Small, medium, and large companies across all industries

---

## 1. Overview

### 1.1 Problem Statement

Companies lose track of IT assets and struggle to manage field-team support workflows when relying on spreadsheets or disconnected tools. Assets go untracked, duplicate records are created, and ticket resolution times suffer from unclear ownership and no audit trail. This system replaces those fragmented processes with a single, self-hosted, fully customizable web application for IT asset lifecycle management and IT help-desk ticketing.

### 1.2 Product Vision

A universal, company-agnostic IT operations platform that any organization can deploy within its own network. Every aspect of the system — asset fields, ticket workflows, roles, teams, dropdown values — is fully configurable by the administrator. The platform delivers government-grade security on a free, open-source stack.

### 1.3 Key Differentiators

| Differentiator | Description |
|---|---|
| Full configurability | Custom asset fields, ticket statuses, roles and teams — no hard-coded restrictions |
| Government-grade security | JWT authentication, RBAC, parameterized queries, security headers, CORS enforcement |
| Self-hosted single-tenant | One deployment per company; data never leaves the company's own server |
| Free & open-source stack | PostgreSQL, Node.js, React — no licensing costs at any scale |
| Dual asset discovery | Automatic network scanning and manual/CSV import — both in one system |

### 1.4 Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 7 + React Router 6 |
| Backend | Node.js 18 + Express 4 |
| Database | PostgreSQL 16 |
| Authentication | JWT + bcrypt (10 rounds) |
| Validation | express-validator |

---

## 2. Goals and Objectives

### 2.1 Business Goals

| ID | Goal | Priority |
|---|---|---|
| BG-1 | Eliminate duplicate asset records by enforcing unique serial/MAC constraints | High |
| BG-2 | Reduce average ticket resolution time through clear team assignment and status tracking | High |
| BG-3 | Maintain a complete, immutable audit trail of every ticket state transition | High |
| BG-4 | Allow every company to fully customize the system without code changes | High |
| BG-5 | Provide structured inventory and ticketing reports for compliance | Medium |
| BG-6 | Support both automated network asset discovery and manual/CSV asset entry | Medium |

### 2.2 Success Metrics

| Metric | Target |
|---|---|
| Asset record accuracy (zero duplicates) | >= 99% |
| Ticket Open-to-Resolved time (priority-1) | <= 24 hours |
| System uptime (business hours) | >= 99.5% |
| API response p95 (list endpoints) | < 500 ms |
| User onboarding time (new admin setup) | < 15 minutes |
| Custom field/status configuration time | < 5 minutes per change |

---

## 3. User Stories

### 3.1 Admin

| ID | User Story | Priority |
|---|---|---|
| US-1 | As an Admin, I want to create user accounts with custom roles so that each team member has the correct access level | High |
| US-2 | As an Admin, I want to customize asset fields (add/remove/edit) so that the inventory matches my company's categorization | High |
| US-3 | As an Admin, I want to define custom ticket statuses and workflows so that the ticket pipeline matches our resolution process | High |
| US-4 | As an Admin, I want to create custom roles and teams so that permissions reflect our organizational structure | High |
| US-5 | As an Admin, I want to run network asset discovery so that I can automatically find devices on our network | Medium |
| US-6 | As an Admin, I want to import existing assets via CSV so that I can migrate from spreadsheets without re-entry | Medium |
| US-7 | As an Admin, I want to configure dropdown values so that form inputs are consistent | Medium |
| US-8 | As an Admin, I want to view dashboard analytics so that I can monitor system health and team workload | Medium |
| US-9 | As an Admin, I want to export reports in PDF and CSV so that I can share them with management | Medium |

### 3.2 Help Desk

| ID | User Story | Priority |
|---|---|---|
| US-10 | As a Help Desk agent, I want to create support tickets quickly so that requesters get fast acknowledgment | High |
| US-11 | As a Help Desk agent, I want to assign tickets to teams so that the right people receive the work | High |
| US-12 | As a Help Desk agent, I want to search users and assets by name, email, or phone so that I can find the right records quickly | High |
| US-13 | As a Help Desk agent, I want to add work notes to tickets so that progress is documented for the next handler | High |

### 3.3 Technical Team

| ID | User Story | Priority |
|---|---|---|
| US-14 | As a Team member, I want to see only tickets assigned to my team so that my workload is focused | High |
| US-15 | As a Team member, I want to update ticket status through the resolution lifecycle so that the requester sees progress | High |
| US-16 | As a Team member, I want to view asset details linked to a ticket so that I have context before starting work | Medium |

### 3.4 General Staff

| ID | User Story | Priority |
|---|---|---|
| US-17 | As a Staff member, I want to raise a ticket from a simple form so that I can request IT support easily | High |
| US-18 | As a Staff member, I want to view my ticket's current status and notes so that I know when my issue will be resolved | Medium |

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization

| ID | Requirement | Priority |
|---|---|---|
| FR-1.1 | Users log in with either email + password or username + password | High |
| FR-1.2 | System issues a JWT valid for 8 hours (configurable) | High |
| FR-1.3 | Inactive users cannot log in | High |
| FR-1.4 | Passwords are hashed with bcrypt at 10 rounds | High |
| FR-1.5 | All protected endpoints require a valid JWT Bearer token | High |
| FR-1.6 | RBAC enforces role-based permissions: Admin (full), Help Desk (write inventory/tickets), Team roles (read inventory + update tickets) | High |
| FR-1.7 | Admin can activate/deactivate user accounts and reset any user's password | High |

### 4.2 User Management

| ID | Requirement | Priority |
|---|---|---|
| FR-2.1 | Admin can create, edit, activate/deactivate users with name, email/username, phone, role, and password | High |
| FR-2.2 | User list supports server-side pagination, search (name/email/phone), and role filter | Medium |

### 4.3 Asset & Inventory Management

| ID | Requirement | Priority |
|---|---|---|
| FR-3.1 | Add/edit asset with a fully configurable field set defined by the Admin | High |
| FR-3.2 | Auto-generate a unique Asset ID from serial_number or mac_address using SHA-256 (first 8 characters) | High |
| FR-3.3 | Reject duplicate serial_number and duplicate mac_address | High |
| FR-3.4 | List all assets with server-side pagination, sort, and multi-field filters | High |
| FR-3.5 | Search assets by user name, email, phone, or asset ID | Medium |
| FR-3.6 | Import assets from CSV with column-to-field mapping | Medium |
| FR-3.7 | Export assets to CSV | Low |
| FR-3.8 | Manage dropdown lookup values (add, edit, delete per field type) | Medium |
| FR-3.9 | Validate MAC address format (XX:XX:XX:XX:XX:XX) and IP address format | High |
| FR-3.10 | At least one of serial_number or mac_address is required to generate an Asset ID | High |
| FR-3.11 | **Network asset discovery** — scan a configured IP range and auto-populate asset records from discovered devices (v2) | Medium |
| FR-3.12 | **Custom asset fields** — Admin can add, edit, or remove fields beyond the default set (v2) | High |

### 4.4 Ticketing

| ID | Requirement | Priority |
|---|---|---|
| FR-4.1 | Create a ticket with title, description, and optional linked inventory asset | High |
| FR-4.2 | New tickets default to the first configured status and are assigned to the default intake team | High |
| FR-4.3 | Assign or transfer a ticket between configurable teams | High |
| FR-4.4 | Update ticket status through a configurable workflow (e.g., Open → In Progress → Pending → Resolved → Closed) | High |
| FR-4.5 | Add work notes to a ticket with timestamp and author | High |
| FR-4.6 | List all tickets with pagination, search, status filter, and team filter | High |
| FR-4.7 | View individual ticket details including full work-note history and linked asset | Medium |
| FR-4.8 | Full audit trail logged in ticket_history for every state change | High |
| FR-4.9 | **Custom ticket statuses and workflows** — Admin defines allowed statuses and transition rules (v2) | High |
| FR-4.10 | **SLA tracking** — configurable SLA deadlines per priority level with visual indicators (v2) | Medium |
| FR-4.11 | **Email notifications** on ticket assignment, status change, and resolution (v2) | Medium |

### 4.5 Knowledge Base

| ID | Requirement | Priority |
|---|---|---|
| FR-5.1 | Admin can create, edit, and categorize knowledge-base articles (v2) | Medium |
| FR-5.2 | Staff can search and browse knowledge-base articles before raising a ticket (v2) | Medium |

### 4.6 Reports & Dashboards

| ID | Requirement | Priority |
|---|---|---|
| FR-6.1 | Dashboard shows real-time summary cards: total assets, open tickets, resolved today, team workload | High |
| FR-6.2 | Asset overview report: count by category, status, location, assignment | Medium |
| FR-6.3 | Ticket metrics report: open/resolved counts, average resolution time, tickets per team | Medium |
| FR-6.4 | Audit trail report: who changed what and when, filterable by user, asset, or ticket | Medium |
| FR-6.5 | Export all reports to PDF and CSV | Medium |
| FR-6.6 | Charts and visual graphs for trends over time (v2) | Low |

### 4.7 Settings & Configuration

| ID | Requirement | Priority |
|---|---|---|
| FR-7.1 | Admin can configure company name, logo, and system branding (v2) | Low |
| FR-7.2 | Admin can manage all dropdown lookup values (v2) | Medium |

---

## 5. Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-1 | API response time (p95) | < 500 ms |
| NFR-2 | Concurrent users supported | >= 200 |
| NFR-3 | Database connection pool size | 10 max (configurable) |
| NFR-4 | JWT token expiry | 8 hours (configurable) |
| NFR-5 | Frontend build size | < 500 KB gzipped |
| NFR-6 | Browser support | Chrome 90+, Edge 90+, Firefox 88+, Safari 14+ |
| NFR-7 | Mobile responsiveness | Fully responsive on mobile browsers |
| NFR-8 | Availability | 99.5% during business hours |
| NFR-9 | Data retention | Indefinite; no soft-delete on tickets or assets |
| NFR-10 | Deployment model | Self-hosted, single-tenant, company's own server |
| NFR-11 | Password storage | bcrypt, 10 rounds, never stored in plaintext |
| NFR-12 | SQL injection protection | All queries parameterized; no string concatenation |

---

## 6. Acceptance Criteria

### 6.1 Authentication & Authorization

- [ ] Login succeeds with valid email/username + correct password; returns JWT within 1 second
- [ ] Login fails with 401 for invalid credentials; 403 for inactive account
- [ ] Every protected endpoint returns 401 when no token is provided
- [ ] Role-based access correctly allows/denies operations per role matrix
- [ ] Admin can activate and deactivate users; deactivated users cannot log in

### 6.2 Asset Management

- [ ] Duplicate serial_number or mac_address is rejected with a clear error message
- [ ] Asset ID is generated automatically and is unique for every asset
- [ ] MAC address and IP address inputs are validated against correct formats
- [ ] CSV import creates assets without duplicating existing records
- [ ] Asset list returns paginated results with correct total count

### 6.3 Ticketing

- [ ] Ticket creation requires title and description; returns 400 if missing
- [ ] Ticket status transitions follow the configured workflow
- [ ] Every status change and work note is recorded in ticket_history with user and timestamp
- [ ] Team assignment restricts ticket visibility to the assigned team plus Admin/Help Desk
- [ ] Ticket list filters by status and team correctly with pagination

### 6.4 Customization

- [ ] Admin can add a new dropdown value and see it appear in the relevant form immediately
- [ ] Custom roles and teams can be created and assigned without code changes
- [ ] Custom asset fields are visible in add/edit forms and list views

### 6.5 Reporting

- [ ] Dashboard summary cards reflect current data accurately
- [ ] All reports are exportable to CSV and PDF
- [ ] Audit trail report shows every action with user, timestamp, and before/after values

### 6.6 Security

- [ ] All SQL queries use parameterized statements (no raw string interpolation)
- [ ] Security headers (HSTS, X-Frame-Options, X-XSS-Protection, nosniff) are present on every response
- [ ] CORS is restricted to configured origins in production mode
- [ ] Passwords are never logged or returned in API responses

### 6.7 Mobile Responsiveness

- [ ] All pages render correctly on mobile viewports (375px width)
- [ ] Touch targets meet minimum 44x44px size requirements
- [ ] Navigation collapses to a hamburger menu on small screens

---

## 7. Timeline and Milestones

### Phase 1 — Core Platform (Weeks 1–4)

| Milestone | Deliverable |
|---|---|
| M1 | Database schema migration (MSSQL → PostgreSQL), admin seed script |
| M2 | Authentication system (login, JWT, RBAC, user CRUD) |
| M3 | Asset inventory module (CRUD, validation, pagination, CSV import/export) |
| M4 | Ticketing module (create, assign, status workflow, work notes, audit trail) |

### Phase 2 — Customization & Search (Weeks 5–6)

| Milestone | Deliverable |
|---|---|
| M5 | Dropdown value management + configurable asset fields |
| M6 | Custom roles and teams management |
| M7 | Advanced search across users and assets |
| M8 | Mobile-responsive frontend refinement |

### Phase 3 — Reporting & Dashboards (Weeks 7–8)

| Milestone | Deliverable |
|---|---|
| M9 | Dashboard with summary cards and charts |
| M10 | Asset overview and ticket metrics reports |
| M11 | Audit trail report with export (PDF/CSV) |
| M12 | E2E test suite covering all critical flows |

### Phase 4 — Advanced Features (Weeks 9–12)

| Milestone | Deliverable |
|---|---|
| M13 | Network asset discovery (auto-scan IP range) |
| M14 | Custom ticket statuses and SLA tracking |
| M15 | Knowledge base (create, search, categorize articles) |
| M16 | Email notification system (SMTP) |

### Phase 5 — Hardening & Launch (Weeks 13–14)

| Milestone | Deliverable |
|---|---|
| M17 | Security audit and penetration testing |
| M18 | Performance benchmarking and optimization |
| M19 | Deployment documentation and admin user guide |
| M20 | Production release (v2.0.0) |

---

## 8. Assumptions & Constraints

| # | Assumption / Constraint |
|---|---|
| A-1 | Each company operates a single deployment (single-tenant, no data sharing between companies) |
| A-2 | The application runs on the company's internal network; no public internet exposure required |
| A-3 | PostgreSQL is available as the database engine (free, open-source) |
| A-4 | Companies have at least one admin user who will configure the system on initial setup |
| A-5 | Network asset discovery requires the server to have network access to the target IP range |
| A-6 | Email notifications (v2) require an SMTP server accessible from the company network |
| A-7 | All users access the system through a web browser; no native mobile app in v1 |
| A-8 | Custom field configuration is performed by Admin only; regular users cannot modify the schema |

---

## 9. Out of Scope (v1)

- Multi-tenancy (supporting multiple companies on one deployment)
- Native mobile apps (iOS / Android)
- SSO integration (Okta, Azure AD, Google Workspace)
- Real-time WebSocket updates
- Document attachment upload on tickets
- AI-powered chatbot or automated ticket routing
- Integration with external ERP or accounting systems

---

## 10. Glossary

| Term | Definition |
|---|---|
| **Asset ID** | Unique hardware identifier generated from the first 8 characters of a SHA-256 hash of serial_number or mac_address |
| **RBAC** | Role-Based Access Control — permissions granted based on the user's assigned role |
| **JWT** | JSON Web Token — a compact token used for authenticated session management |
| **SLA** | Service Level Agreement — a target deadline for ticket resolution, configurable per priority level |
| **Lookup Value** | A predefined dropdown option (e.g., asset category, department) |
| **Self-hosted** | The application runs on the company's own server infrastructure, not on a third-party cloud platform |
| **Single-tenant** | One deployment serves one company; data is completely isolated per deployment |
| **Work Note** | A timestamped comment added by a team member to document progress on a ticket |
