# PRD: Ticketing System

## 1. Objective
Enable efficient IT support ticket creation, assignment, tracking, and resolution with full audit trail.

## 2. Scope
### In scope
- Ticket creation with title, description, optional asset link
- Status workflow (Open → In Progress → Pending → Resolved → Closed)
- Team assignment and transfer
- Work notes with timestamp and author
- Full audit history in ticket_history
- Pagination, search, status/team filters
- SLA tracking (v2)
- Email notifications (v2)

### Out of scope
- Ticket priority auto-calculation
- Escalation rules
- Ticket merging/duplication detection
- Document attachments

## 3. Users & Roles
| Role | Create | View Own | View All | Update | Assign |
|------|--------|----------|----------|--------|--------|
| Admin | Yes | Yes | Yes | Yes | Yes |
| Help Desk | Yes | Yes | Yes | Yes | Yes |
| IT Team | Yes | Yes | Team only | Yes | Team only |
| Network Team | Yes | Yes | Team only | Yes | Team only |
| Cybersecurity | Yes | Yes | Team only | Yes | Team only |

## 4. Data Model
```
tickets {
  id: SERIAL PK
  title: VARCHAR(255) NOT NULL
  description: TEXT NOT NULL
  status: VARCHAR(50) NOT NULL DEFAULT 'Open'
  created_by: INTEGER FK → users.id
  assigned_team: VARCHAR(100) NOT NULL DEFAULT 'IT Help Desk'
  inventory_id: INTEGER FK → inventory.id NULL
  work_notes: TEXT NULL
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

ticket_history {
  id: SERIAL PK
  ticket_id: INTEGER FK → tickets.id
  action: VARCHAR(100) NOT NULL
  from_team: VARCHAR(100) NULL
  to_team: VARCHAR(100) NULL
  note: VARCHAR(500) NULL
  performed_by: INTEGER FK → users.id
  created_at: TIMESTAMP
}
```

## 5. API Endpoints
```
GET    /api/tickets               → paginated list
POST   /api/tickets               → create ticket
GET    /api/tickets/:id           → ticket details + history
PATCH  /api/tickets/:id/status    → update status
POST   /api/tickets/:id/notes     → add work note
PATCH  /api/tickets/:id/assign    → transfer team
```

## 6. Status Workflow
```
Open → In Progress → Pending → Resolved → Closed
                ↘              ↗
              (Reopened)
```
Only Admin/Help Desk can move to Pending. Teams can transition In Progress → Resolved.

## 7. Acceptance Criteria
- [ ] Ticket creation requires title and description
- [ ] New ticket defaults to "Open" status
- [ ] Status transitions follow configured workflow
- [ ] Every status change logged in ticket_history
- [ ] Work notes include timestamp and author
- [ ] Team members see only their team's tickets
- [ ] Ticket history shows complete audit trail
