# PRD Review Notes: Ticketing System

> **Review Date:** 2026-08-25
> **PRD File:** `docs/PRD/PRD-ticketing.md`
> **Reviewer:** Agnes (Claude Code)

---

## Status Workflow Validation

### CHECK Constraint from DDL:
```sql
CONSTRAINT chk_tickets_status CHECK (
    status IN ('Open', 'In Progress', 'Pending', 'Resolved', 'Closed')
)
```

### PRD Section 6 Status Workflow:
```
Open → In Progress → Pending → Resolved → Closed
                ↘              ↗
              (Reopened)
```

| PRD Status | DDL CHECK Constraint | Match? |
|------------|---------------------|--------|
| Open | ✅ `Open` | ✅ Matches |
| In Progress | ✅ `In Progress` | ✅ Matches |
| Pending | ✅ `Pending` | ✅ Matches |
| Resolved | ✅ `Resolved` | ✅ Matches |
| Closed | ✅ `Closed` | ✅ Matches |

**All 5 statuses match the CHECK constraint exactly.** ✅

### Transition Rules (from PRD):
- "Only Admin/Help Desk can move to Pending" — ✅ Clear rule
- "Teams can transition In Progress → Resolved" — ✅ Clear rule
- "Reopened" path from Resolved back to In Progress — ✅ Documented
- Missing: Can tickets be moved directly Open → Closed? Open → Resolved? In Progress → Pending? These are not specified.

---

## Immutable History Validation

### DDL ticket_history columns:
| Column | Type | PRD Requirement | Match? |
|--------|------|-----------------|--------|
| `ticket_id` | INTEGER FK → tickets(id) | "logged in ticket_history" | ✅ |
| `action` | VARCHAR(100) NOT NULL | "Every state change logged" | ✅ |
| `from_team` | VARCHAR(100) NULL | Not explicitly required | ⚠️ Partial |
| `to_team` | VARCHAR(100) NULL | Not explicitly required | ⚠️ Partial |
| `note` | VARCHAR(500) NULL | "with reason" | ✅ |
| `performed_by` | INTEGER FK → users(id) | "with user" | ✅ |
| `created_at` | TIMESTAMPTZ NOT NULL DEFAULT NOW() | "with timestamp" | ✅ |

**History tracking is well-defined.** The PRD specifies "Every status change logged with timestamp, user, and reason" — the DDL supports this fully.

---

## Assignment Logic Validation

### PRD Section 3 Role Matrix:
| Role | View | Update | Assign |
|------|------|--------|--------|
| Admin | All | Yes | Yes |
| Help Desk | All | Yes | Yes |
| IT Team | Team only | Yes | Team only |
| Network Team | Team only | Yes | Team only |
| Cybersecurity | Team only | Yes | Team only |

**Assessment:** Assignment logic is clearly defined. "Team only" visibility and assignment is consistent across all team roles.

### DDL assigned_team CHECK constraint:
```sql
CONSTRAINT chk_tickets_team CHECK (
    assigned_team IN ('IT Help Desk', 'IT Team', 'Network Team', 'Cybersecurity Team')
)
```

**⚠️ Mismatch:** The role matrix uses "Cybersecurity" but the DDL uses "Cybersecurity Team". Similarly, the PRD says "IT Team" can assign to "Team only" but the DDL has "IT Team" as a valid assigned_team value. These are consistent — the team names in assigned_team match the role names. ✅

---

## Gaps Identified

### G1 — Incomplete Status Transition Rules (High)
**Location:** Section 6 (Status Workflow)
**Issue:** Only 3 transition rules are specified:
1. Open → In Progress (all roles)
2. In Progress → Pending (Admin/Help Desk only)
3. In Progress → Resolved (teams)
4. Resolved → Closed (implied)
5. Resolved → In Progress (Reopened, implied)

Missing transitions:
- Can Open → Resolved directly?
- Can Open → Pending directly?
- Can In Progress → Closed directly?
- Can Pending → Open? (rejected by whom?)
- Can Pending → Resolved?
- Can any status → Closed except Resolved?
**Recommendation:** Add a complete transition matrix showing allowed transitions per role.

### G2 — No Priority Field in Data Model (Medium)
**Location:** Section 4 (Data Model), Section 2 (Scope)
**Issue:** PRD Scope says "Ticket priority auto-calculation" is out of scope (v2), but there is no `priority` column in the DDL either. The ticket data model has no priority at all. This is fine for v1 but should be explicitly noted that priority is a v2 addition.
**Recommendation:** Add a v2 note in the data model section.

### G3 — No SLA Definition Despite v2 Mention (Medium)
**Location:** Section 2 (Scope)
**Issue:** "SLA tracking (v2)" is listed as in scope but no SLA fields, thresholds, or breach logic is defined. The DDL has no SLA columns.
**Recommendation:** Define SLA columns (response_time, resolution_time) in a v2 migration plan.

### G4 — No Email Notification Specification (Medium)
**Location:** Section 2 (Scope)
**Issue:** "Email notifications (v2)" is listed but no notification events, templates, or delivery rules are defined.
**Recommendation:** Define notification events (ticket created, assigned, status changed, resolved) and delivery method (email, in-app, or both).

### G5 — Missing "Reopened" Status in Workflow Diagram (Low)
**Location:** Section 6 (Status Workflow)
**Issue:** The workflow diagram shows "Reopened" as a label on the arrow from Resolved back to In Progress, but "Reopened" is not a valid status in the CHECK constraint. This could confuse developers into thinking "Reopened" is a status value.
**Recommendation:** Clarify that "Reopened" is a transition label, not a status value. The ticket goes from Resolved → In Progress.

### G6 — Work Notes Not Explicitly in Ticket History (Low)
**Location:** Section 2 (Scope)
**Issue:** "Work notes with timestamp and author" is listed but the ticket_history table has a `note` column (VARCHAR(500)) that serves double duty for both status changes and work notes. There is no separate `work_notes` history entry type.
**Current implementation:** Work notes are stored in `tickets.work_notes` (TEXT) and history is logged via ticket_history. This is reasonable but the PRD should clarify that work notes are both in the ticket record AND in the history log.

### G7 — No Ticket Deletion Specification (Low)
**Location:** Section 2 (Scope), Section 5 (API Endpoints)
**Issue:** No DELETE endpoint is listed. Is ticket deletion allowed? The DDL has `ON DELETE CASCADE` on ticket_history, implying tickets can be deleted. But the PRD doesn't specify who can delete tickets or under what conditions.
**Recommendation:** Add a DELETE endpoint with role restriction (Admin only?).

---

## Summary

- **Status workflow:** ✅ All 5 statuses match DDL CHECK constraint exactly
- **History tracking:** ✅ Complete — timestamp, user, action, and reason all captured
- **Assignment logic:** ✅ Clear and consistent with DDL
- **Total gaps:** 7 (0 Critical, 1 High, 3 Medium, 3 Low)
- **Highest priority gap:** Incomplete status transition rules (G1)
- **Overall assessment:** Strong PRD with good workflow coverage. The main gap is the incomplete transition matrix. All other gaps are manageable for v1 implementation.
