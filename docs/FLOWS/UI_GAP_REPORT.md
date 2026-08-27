# UI Gap Report

> **Generated:** 2026-08-25 · Day 3 User Workflow Definition
> **Context:** Discrepancies between `docs/FLOWS/user-flows.md` flows and actual frontend implementation.

---

## Gap 1: Dashboard Landing Flow Missing from Documentation

**Type:** Missing flow · Missing from `user-flows.md`

**Evidence:**
- `Dashboard.jsx` is the protected-app landing page at `/`
- Contains 4 stat cards (Total Assets, Available, Assigned, Open Tickets)
- Contains quick-action cards to all 4 core pages
- Contains "Recent Assets" and "Recent Tickets" sections
- Has system status pill and active-user count

**Proposed Solution:**
Add a new flow **"Dashboard Overview"** to `user-flows.md` covering:
1. Post-login redirect to `/`
2. Stat card interpretation
3. Quick-action navigation
4. Recent items list with "View all" links

---

## Gap 2: Settings / Dropdown Management Flow Missing

**Type:** Missing flow · Missing from `user-flows.md`

**Evidence:**
- `Settings.jsx` exists at `/settings`
- Contains dropdown lookup management (add/edit/delete lookup values)
- Supports FR-3.8 and FR-7.2

**Proposed Solution:**
Add a new flow **"Configure Dropdown Lookups"** to `user-flows.md`:
1. Admin navigates to `/settings`
2. Selects a lookup type
3. Adds new dropdown values
4. Edits or deletes existing values

---

## Gap 3: Reports Flow Missing

**Type:** Missing flow · Missing from `user-flows.md`

**Evidence:**
- `Reports.jsx` exists at `/reports`
- Shows asset counts by status, ministry, team
- Shows ticket metrics and trends
- Supports FR-6.2 through FR-6.5

**Proposed Solution:**
Add a new flow **"View Reports"** to `user-flows.md`:
1. Admin navigates to `/reports`
2. Selects report type (asset overview / ticket metrics)
3. Reviews tables and summary cards
4. Exports to CSV if needed

---

## Gap 4: Ticket Detail Modal — No Immutable History View

**Type:** UI gap · Partial implementation

**Evidence:**
- `TicketsList.jsx` line 244–287: ticket detail modal shows title, status, team, description, work notes
- The detail modal displays `work_notes` as a single textarea but **does not show the ticket_history log** (per-ticket immutable audit trail)
- PRD FR-4.8 requires "full audit trail logged in ticket_history for every state change"

**Proposed Solution:**
Update `TicketsList.jsx` ticket detail modal to:
1. Fetch and display `ticket_history` entries per ticket (sorted by `created_at DESC`)
2. Show each entry with: action, from_team, to_team, note, performed_by name, timestamp
3. Add a "History" tab or expandable section within the modal

---

## Gap 5: Asset Edit — No Inline Edit Path

**Type:** UI gap · Partial implementation

**Evidence:**
- `InventoryManagement.jsx` line 745: "Edit" button exists but calls `showPendingAction("Edit")` which is **not defined** in the component
- The asset modal at line 779 is only used for adding new assets; there is no pre-populated edit modal
- `editAsset` service function exists but is not wired to any UI action

**Proposed Solution:**
Either:
- **(A)** Wire the "Edit" button to open the existing modal pre-populated with the asset data (preferred — reuse existing modal)
- **(B)** Create a separate edit modal component with the same 6-section layout

---

## Gap 6: CSV Import — No Row-by-Row Error Feedback

**Type:** UX gap · Partial implementation

**Evidence:**
- `InventoryManagement.jsx` lines 533–552: `importCsv()` iterates row-by-row and calls `addInventory()` for each
- On any failure, the catch block shows a generic "CSV import failed" message
- No per-row error tracking or partial-success reporting

**Proposed Solution:**
1. Collect individual row errors during import
2. After import completes, show a summary: "X of Y rows imported successfully; Z failed"
3. List failed rows with row number and error reason

---

## Gap 7: No "My Tickets" View for General Staff

**Type:** Missing flow · PRD gap

**Evidence:**
- PRD US-18: "As a Staff member, I want to view my ticket's current status and notes"
- No route or page exists for a staff member to see only their own tickets
- `TicketsList.jsx` shows all tickets (admin/help desk view)

**Proposed Solution:**
Add a route `/my-tickets` with a filtered view showing only tickets where `created_by === currentUser.id`, or add a tab to the existing tickets page for staff-only view.

---

## Gap Summary

| Gap | Severity | Type | Proposed Fix |
|-----|----------|------|-------------|
| 1 | Medium | Missing flow | Add "Dashboard Overview" flow |
| 2 | Medium | Missing flow | Add "Configure Dropdown Lookups" flow |
| 3 | Medium | Missing flow | Add "View Reports" flow |
| 4 | High | UI gap | Show ticket_history in detail modal |
| 5 | High | UI gap | Wire "Edit" button to pre-populated modal |
| 6 | Low | UX gap | Add per-row import error reporting |
| 7 | Medium | Missing flow | Add `/my-tickets` staff view |

**Total gaps:** 7 (2 High, 3 Medium, 2 Low)
