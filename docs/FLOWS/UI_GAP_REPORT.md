# UI Gap Report

> **Generated:** 2026-08-25 · Day 3 User Workflow Definition
> **Updated:** 2026-08-27 · Day 8 — RBAC Audit & Documentation Sync
> **Context:** Discrepancies between `docs/FLOWS/user-flows.md` flows and actual frontend implementation.

---

## Gap 1: Dashboard Landing Flow Missing from Documentation

**Type:** Missing flow · Missing from `user-flows.md` (original v1.0)
**Status:** ✅ Resolved in v2.0 — Flow 6 added to `user-flows.md`

---

## Gap 2: Settings / Dropdown Management Flow Missing

**Type:** Missing flow · Missing from `user-flows.md` (original v1.0)
**Status:** ✅ Resolved in v2.0 — Flow 7 added to `user-flows.md`

---

## Gap 3: Reports Flow Missing

**Type:** Missing flow · Missing from `user-flows.md` (original v1.0)
**Status:** ✅ Resolved in v2.0 — Flow 8 added to `user-flows.md`

---

## Gap 4: Ticket Detail Modal — History Log Display

**Type:** UI gap · Partial implementation
**Status:** ⚠️ Still open

**Evidence:**
- `ticketService.js:getTicketById` returns `{ ...ticket, history: history.rows }` with full audit trail
- `backend/routes/ticketRoutes.js` line 17: `GET /api/tickets/:id` returns history
- The ticket detail modal must fetch and display the `history` array

**Proposed Solution:**
Update the ticket detail modal to:
1. Fetch and display `ticket_history` entries (sorted by `created_at ASC`)
2. Show each entry with: action, from_team, to_team, note, performed_by name, timestamp
3. Add a "History" tab or expandable section within the modal

---

## Gap 5: Asset Edit — Button Not Wired

**Type:** UI gap · Partial implementation
**Status:** ⚠️ Still open

**Evidence:**
- `InventoryManagement.jsx` has an "Edit" button per row
- `inventoryService.js` has `editAsset` function
- The button must call `PUT /api/inventory/:id` with the form data

**Proposed Solution:**
Wire the "Edit" button to open the existing modal pre-populated with the asset data (preferred — reuse existing modal).

---

## Gap 6: CSV Import — No Row-by-Row Error Feedback

**Type:** UX gap · Partial implementation
**Status:** ⚠️ Still open

**Evidence:**
- `InventoryManagement.jsx` iterates row-by-row calling `addInventory()` for each
- On any failure, shows a generic "CSV import failed" message
- No per-row error tracking or partial-success reporting

**Proposed Solution:**
1. Collect individual row errors during import
2. After import completes, show a summary: "X of Y rows imported successfully; Z failed"
3. List failed rows with row number and error reason

---

## Gap 7: No "My Tickets" View for General Staff

**Type:** Missing flow · PRD gap
**Status:** 🔴 Not implemented

**Evidence:**
- PRD US-18: "As a Staff member, I want to view my ticket's current status and notes"
- No route or page exists for a staff member to see only their own tickets
- `TicketsList.jsx` shows all tickets (admin/help desk view)

**Proposed Solution:**
Add a route `/my-tickets` with a filtered view showing only tickets where `created_by === currentUser.id`, or add a tab to the existing tickets page for staff-only view.

---

## Gap 8: Audit Trail Report Page

**Type:** Missing page · PRD gap
**Status:** 🔴 Not implemented

**Evidence:**
- Backend has `ticket_history` table with full immutable audit trail
- No UI page aggregates this data into a report
- PRD FR-6.5 calls for an "audit trail report"

**Proposed Solution:**
Create an `/audit` page that aggregates `ticket_history` entries across all tickets, showing action, actor, timestamp, and before/after values.

---

## Gap 9: Mobile Hamburger Menu

**Type:** UX gap · Responsive design
**Status:** 🔴 Not implemented

**Evidence:**
- `Layout.jsx` uses a fixed sidebar with no responsive breakpoint
- No hamburger menu on small screens
- Touch targets may be below 44px

**Proposed Solution:**
Add a responsive breakpoint in `Layout.jsx` with a hamburger toggle that collapses the sidebar on screens < 768px.

---

## Gap Summary

| Gap | Severity | Type | Status |
|-----|----------|------|--------|
| 1 | Medium | Missing flow | ✅ Resolved (v2.0) |
| 2 | Medium | Missing flow | ✅ Resolved (v2.0) |
| 3 | Medium | Missing flow | ✅ Resolved (v2.0) |
| 4 | High | UI gap | ⚠️ Open |
| 5 | High | UI gap | ⚠️ Open |
| 6 | Low | UX gap | ⚠️ Open |
| 7 | Medium | Missing flow | 🔴 Not implemented |
| 8 | Medium | Missing page | 🔴 Not implemented |
| 9 | Medium | UX gap | 🔴 Not implemented |

**Total gaps:** 9 (2 High, 4 Medium, 1 Low, 2 Resolved)
**Open gaps requiring action:** 7

---

## Security Gaps (from RBAC Audit)

| ID | Severity | Finding | Status |
|----|----------|---------|--------|
| 3.3 | MEDIUM | No rate limiting on `/api/auth/login` | ⚠️ Open |
| 3.6 | MEDIUM | Network Team/Cybersecurity excluded from Dashboard/Reports | ⚠️ Needs product owner decision |
| 3.11 | MEDIUM | JWT role claim trusted without DB verification | ⚠️ Open — mitigation: keep JWT_SECRET secure |
| 3.8 | LOW | No audit trail for 403 responses | ⚠️ Informational |
