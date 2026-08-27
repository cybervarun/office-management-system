# Flow-to-Page Traceability Matrix

> **Generated:** 2026-08-25 · Day 3 User Workflow Definition
> **Sources:** `docs/FLOWS/user-flows.md`, `frontend/src/App.jsx`, `frontend/src/pages/`

---

## Mapping

| # | Flow Name | Page/Component Path | Route | Status | Notes |
|---|-----------|---------------------|-------|--------|-------|
| 1 | Login | `frontend/src/pages/Login.jsx` | `/login` | ✅ Implemented | Email + password, JWT storage, error display |
| 2 | Raise a Ticket | `frontend/src/pages/RaiseTicketForm.jsx` | `/raise-ticket` | ✅ Implemented | Asset search + auto-fill, min. fields enforced via `canSubmit` |
| 3 | Resolve a Ticket | `frontend/src/pages/TicketsList.jsx` | `/tickets` | ✅ Implemented | Status updates, transfer, work notes, detail modal |
| 4 | Add an Asset | `frontend/src/pages/InventoryManagement.jsx` | `/inventory` | ✅ Implemented | Modal form, 6-section layout, CSV import/export, dropdown management |
| 5 | Manage Users | `frontend/src/pages/UsersManagement.jsx` | `/users` | ✅ Implemented | Create inline, edit modal, activate/deactivate toggle |
| — | Dashboard (quick actions) | `frontend/src/pages/Dashboard.jsx` | `/` | ✅ Implemented | Stat cards, recent assets/tickets, quick-action navigation |
| — | Reports | `frontend/src/pages/Reports.jsx` | `/reports` | ✅ Implemented | Asset/ticket metrics tables, CSV export |
| — | Settings | `frontend/src/pages/Settings.jsx` | `/settings` | ✅ Implemented | Notification config, dropdown management |

---

## Coverage Summary

| Category | Count |
|----------|-------|
| Documented flows | 5 |
| Pages with matching flows | 5 / 5 |
| Pages without explicit flow docs | 3 (Dashboard, Reports, Settings) |
| Total pages in app | 8 (incl. Login) |
| Missing frontend pages for documented flows | 0 |

---

## Un-documented Pages

| Page | Route | Description | Relevance |
|------|-------|-------------|-----------|
| Dashboard | `/` | Summary stats, quick actions, recent activity | Primary landing page; should have its own flow |
| Reports | `/reports` | Asset overview, ticket metrics, user stats | Supports PRD FR-6.2 through FR-6.5 |
| Settings | `/settings` | Notification preferences, dropdown lookup management | Supports PRD FR-3.8 and FR-7.2 |

These pages exist and are functional but are not captured in `user-flows.md`. They should be added as flows in the next iteration.
