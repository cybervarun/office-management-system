# Business Requirements Document (BRD)

**Document Version:** 1.0.0
**Date:** 2026-08-24

---

## 1. Business Context

A government office procures and deploys IT equipment across multiple ministries, departments, and locations. Support requests arrive via phone, email, or in-person and are tracked informally. This results in:

- Lost or untracked assets
- Duplicate asset records (same serial number registered twice)
- Ticket delays due to unclear assignment
- No audit trail for who changed what and when

This system addresses those gaps by providing a single web application for IT asset lifecycle management and IT help-desk ticketing.

---

## 2. Business Objectives

| ID | Objective | Priority |
|----|-----------|----------|
| BO-1 | Eliminate duplicate asset records by enforcing unique serial/MAC binding | High |
| BO-2 | Reduce average ticket resolution time by providing clear team assignment | High |
| BO-3 | Maintain a complete audit trail of ticket state transitions | Medium |
| BO-4 | Enable bulk import of existing inventory via CSV | Medium |
| BO-5 | Provide role-based access so only authorized personnel can modify data | High |
| BO-6 | Support government-standard inventory reporting fields | High |

---

## 3. User Personas

### 3.1 Admin

- Creates and manages user accounts
- Assigns roles (Admin, Help Desk, IT Team, Network Team, Cybersecurity)
- Activates/deactivates accounts
- Resets passwords
- Manages dropdown lookup values (ministry, department, etc.)

### 3.2 Help Desk

- Creates new support tickets
- Assigns tickets to technical teams
- Updates ticket status
- Views all inventory records
- Adds/edits inventory assets
- Searches users by name/email

### 3.3 IT Team / Network Team / Cybersecurity

- Views tickets assigned to their team
- Updates ticket status (In Progress → Resolved → Closed)
- Adds work notes
- Views inventory (read-only)
- Searches users

### 3.4 General Staff (implied by read access)

- Can search for asset information
- Can raise tickets for their assigned assets

---

## 4. Functional Requirements

### FR-1: Authentication

| ID | Requirement | Priority |
|----|------------|----------|
| FR-1.1 | Users log in with email + password | High |
| FR-1.2 | System issues a JWT valid for 8 hours | High |
| FR-1.3 | Inactive users cannot log in | High |
| FR-1.4 | Passwords hashed with bcrypt (10 rounds) | High |

### FR-2: User Management (Admin Only)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-2.1 | Create user with name, email, phone, role, password | High |
| FR-2.2 | Edit user role | High |
| FR-2.3 | Reset user password | High |
| FR-2.4 | Activate/deactivate user accounts | Medium |
| FR-2.5 | Paginated user list with search and role filter | Medium |
| FR-2.6 | Search users by query string (name/email/phone) | Medium |

### FR-3: Inventory Management

| ID | Requirement | Priority |
|----|------------|----------|
| FR-3.1 | Add asset with government-standard fields (ministry, department, asset_category, location, lifecycle dates) | High |
| FR-3.2 | Auto-generate Asset ID from serial_number or mac_address | High |
| FR-3.3 | Reject duplicate serial_number or mac_address | High |
| FR-3.4 | Edit existing asset records | High |
| FR-3.5 | List all assets with pagination, sort, and filters (ministry, department, category, status, EDR, UEM) | High |
| FR-3.6 | Search assets by user name, email, or phone | Medium |
| FR-3.7 | Import inventory from CSV | Medium |
| FR-3.8 | Export inventory to CSV | Low |
| FR-3.9 | Manage dropdown lookup values (add new ministry, department, category, OS, network type) | Medium |
| FR-3.10 | Validate MAC address format (XX:XX:XX:XX:XX:XX) | High |
| FR-3.11 | Validate IP address format (dotted quad) | High |
| FR-3.12 | At least one of serial_number or mac_address required | High |

### FR-4: Ticketing

| ID | Requirement | Priority |
|----|------------|----------|
| FR-4.1 | Create ticket with title, description, optional linked inventory asset | High |
| FR-4.2 | New tickets default to "Open" status, assigned to IT Help Desk | High |
| FR-4.3 | Assign/transfer ticket to a team (IT Help Desk, IT Team, Network Team, Cybersecurity Team) | High |
| FR-4.4 | Update ticket status (Open → In Progress → Pending → Resolved → Closed) | High |
| FR-4.5 | Add work notes to a ticket | High |
| FR-4.6 | View all tickets with pagination and filters (status, team) | High |
| FR-4.7 | View individual ticket details | Medium |
| FR-4.8 | Full audit history logged in ticket_history table | Medium |

### FR-5: Security

| ID | Requirement | Priority |
|----|------------|----------|
| FR-5.1 | JWT Bearer token required on all protected endpoints | High |
| FR-5.2 | RBAC: Admin + Help Desk can write; all roles can read | High |
| FR-5.3 | Security headers (HSTS, X-Frame-Options, X-XSS-Protection, nosniff) | High |
| FR-5.4 | CORS restricted to allowed origins in production | High |
| FR-5.5 | All SQL queries parameterized (no string concatenation) | High |

---

## 5. Non-Functional Requirements

| ID | Requirement | Target |
|----|------------|--------|
| NFR-1 | API response time (p95) | < 500 ms |
| NFR-2 | Concurrent users supported | ≥ 100 |
| NFR-3 | Database connection pool size | 10 max (configurable) |
| NFR-4 | JWT token expiry | 8 hours (configurable via JWT_EXPIRES_IN) |
| NFR-5 | Frontend build size | < 500 KB gzipped |
| NFR-6 | Browser support | Chrome 90+, Edge 90+, Firefox 88+ |
| NFR-7 | Availability | 99.5% during business hours (08:00–20:00) |
| NFR-8 | Data retention | Indefinite (no soft-delete on tickets/assets) |

---

## 6. User Workflows

### 6.1 Raise a Support Ticket

```
User → Login → Dashboard → Raise Ticket
  → Fill title, description
  → Optionally link inventory asset (search by user/email)
  → Fill ministry, department, location details
  → Submit → Ticket created (status: Open, team: IT Help Desk)
  → Confirmation message shown
```

### 6.2 Resolve a Ticket

```
IT Team Member → Login → Tickets
  → Filter by team or status
  → Click ticket → View details + work notes
  → Update status to "In Progress"
  → Add work notes
  → Update status to "Resolved" or "Closed"
```

### 6.3 Add an Asset

```
Admin/Help Desk → Login → Inventory → Add Asset
  → Fill all required fields (ministry, department, category, description)
  → Provide serial_number OR mac_address (triggers Asset ID generation)
  → Fill optional fields (location, lifecycle dates, EDR/UEM status)
  → Save → Asset stored with generated asset_id
```

### 6.4 Manage Users

```
Admin → Login → Users
  → View paginated user list
  → Create: fill name, email, phone, role, password → Save
  → Edit role: click role dropdown → Select new role → Save
  → Reset password: click reset → Enter new password → Save
  → Activate/Deactivate: toggle button → Confirmed
```

---

## 7. Assumptions & Constraints

| # | Assumption |
|---|-----------|
| A-1 | All users are internal government office staff with known email addresses |
| A-2 | SQL Server is available on the office network (on-premise deployment) |
| A-3 | Single-tenant deployment (one database, one office) |
| A-4 | No integration with external identity providers (AD/LDAP) in v1 |
| A-5 | Inventory CSV files follow a predefined column structure |

---

## 8. Glossary

| Term | Definition |
|------|-----------|
| **Asset ID** | Unique hardware identifier generated by hashing the first 8 chars of serial_number or mac_address |
| **EDR** | Endpoint Detection and Response software |
| **UEM** | Unified Endpoint Management |
| **AMC** | Annual Maintenance Contract |
| **RBAC** | Role-Based Access Control |
