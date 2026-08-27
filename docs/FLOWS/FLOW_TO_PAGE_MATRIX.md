# Flow-to-Page Traceability Matrix

> **Generated:** 2026-08-25 · Day 3 User Workflow Definition
> **Updated:** 2026-08-27 · Day 8 — RBAC Audit & Documentation Sync
> **Sources:** `docs/FLOWS/user-flows.md`, `frontend/src/App.jsx`, `frontend/src/pages/`

---

## Mapping

| # | Flow Name | Page/Component Path | Route | RBAC | Status | Notes |
|---|-----------|---------------------|-------|------|--------|-------|
| 1 | Login | `frontend/src/pages/Login.jsx` | `/login` | Public | ✅ Implemented | Email + password, JWT storage, error display |
| 2 | Raise a Ticket | `frontend/src/pages/RaiseTicketForm.jsx` | `/raise-ticket` | Admin, Help Desk | ✅ Implemented | Asset search + auto-fill, min. fields enforced via `canSubmit` |
| 3 | Resolve a Ticket | `frontend/src/pages/TicketsList.jsx` | `/tickets` | All roles | ✅ Implemented | Status updates, transfer, work notes, history in detail modal |
| 4 | Add an Asset | `frontend/src/pages/InventoryManagement.jsx` | `/inventory` | Admin, Help Desk (write); All (read) | ✅ Implemented | Modal form, 6-section layout, CSV import/export, dropdown management |
| 5 | Manage Users | `frontend/src/pages/UsersManagement.jsx` | `/users` | Admin only | ✅ Implemented | Create inline, edit modal, role change, password reset, activate/deactivate |
| 6 | Dashboard Overview | `frontend/src/pages/Dashboard.jsx` | `/` | Admin, Help Desk, IT Team | ✅ Implemented | Stat cards, recent assets/tickets, quick-action navigation |
| 7 | Configure Dropdown Lookups | `frontend/src/pages/Settings.jsx` | `/settings` | Admin only | ✅ Implemented | Notification config, dropdown lookup management |
| 8 | View Reports | `frontend/src/pages/Reports.jsx` | `/reports` | Admin, Help Desk, IT Team | ✅ Implemented | Asset/ticket metrics tables, CSV export |

---

## Coverage Summary

| Category | Count |
|----------|-------|
| Documented flows | 8 |
| Pages with matching flows | 8 / 8 |
| Pages without explicit flow docs | 0 |
| Total pages in app | 8 (incl. Login) |
| Missing frontend pages for documented flows | 0 |

---

## RBAC Access Summary

| Page | Route | Accessible By |
|------|-------|---------------|
| Login | `/login` | Anyone (public) |
| Dashboard | `/` | Admin, Help Desk, IT Team |
| Inventory | `/inventory` | All authenticated roles (write: Admin, Help Desk) |
| Raise Ticket | `/raise-ticket` | Admin, Help Desk |
| Tickets | `/tickets` | All authenticated roles |
| Users | `/users` | Admin only |
| Reports | `/reports` | Admin, Help Desk, IT Team |
| Settings | `/settings` | Admin only |

---

## Known Gaps (tracked in UI_GAP_REPORT.md)

| Gap | Severity | Status |
|-----|----------|--------|
| 4 | Ticket detail modal — history log visibility | High · Partial (backend returns history, UI may not render) |
| 5 | Asset edit — button not fully wired | High · Partial |
| 6 | CSV import — no per-row error feedback | Low · Partial |
| 7 | No "My Tickets" view for general staff | Medium · Unimplemented |
| Audit trail page | — | Not implemented (backend has `ticket_history`, no UI report) |
| Mobile hamburger menu | — | Not implemented (fixed sidebar) |
| PDF export for reports | v2 scope | Out of scope (v2) |
