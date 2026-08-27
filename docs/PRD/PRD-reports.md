# PRD: Dashboard & Reports

## 1. Objective
Provide real-time visibility into IT operations through dashboards and structured reports.

## 2. Scope
### In scope
- Dashboard summary cards (assets, tickets, workload)
- Asset overview report (by category, status, location)
- Ticket metrics report (open/resolved, resolution time)
- Audit trail report (who changed what, when)
- Export to CSV and PDF
- Charts and visual graphs (v2)

### Out of scope
- Real-time WebSocket updates
- Custom report builder
- Scheduled report delivery

## 3. Users & Roles
- Admin: full access to all reports
- Help Desk: ticket and asset reports
- Other roles: read-only access to assigned data

## 4. Dashboard Metrics
| Card | Description |
|------|-------------|
| Total Assets | Count of all inventory records |
| Open Tickets | Tickets with status Open or In Progress |
| Resolved Today | Tickets resolved in current day |
| Team Workload | Tickets per team (current) |

## 5. API Endpoints
```
GET    /api/dashboard/stats       → summary metrics
GET    /api/reports/assets        → asset overview report
GET    /api/reports/tickets       → ticket metrics report
GET    /api/reports/audit         → audit trail report
GET    /api/reports/assets/export → CSV export
GET    /api/reports/tickets/export → CSV export
```

## 6. Acceptance Criteria
- [ ] Dashboard cards reflect current data accurately
- [ ] Reports load within 2 seconds for <10k records
- [ ] All reports exportable to CSV
- [ ] PDF export available (using react-to-print or similar)
- [ ] Audit report shows before/after values
- [ ] Reports respect RBAC (users see only their data)
