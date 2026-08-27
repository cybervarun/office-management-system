# Project Plan: AI Context Engineering Framework Implementation

**Project:** IT Asset & Ticket Management System — Context Engineering Setup
**Start Date:** 2026-08-25
**Working Hours:** 10:00 AM – 5:30 PM (7.5 hours/day)
**Total Duration:** 10 business days (2 calendar weeks)

---

## 1. Objective

Establish a complete context engineering framework that enables AI development agents to build the IT Asset & Ticket Management System with predictable, non-hallucinated outputs. All documentation must be finalised, validated, and ready for Phase 1 implementation (PostgreSQL migration + Authentication).

---

## 2. Task Breakdown & Timeline

### Week 1: Foundation & Schema (Days 1–5)

#### Day 1 — Context Framework Review (5 hours)

> **Pre-work:** Ensure `AGENTS_NOTES.md` and `GAP_ANALYSIS_REPORT.md` templates are available in the project root before starting.

| Time | Task | Deliverable | Dependency |
|------|------|-------------|------------|
| 10:00–11:30 | Read `AGENTS.md` end-to-end; for each ambiguous or unclear line, record: (a) original text, (b) the ambiguity, (c) a proposed rewrite | `AGENTS_NOTES.md` (completed) | None |
| 11:30–11:45 | **Handoff & Review:** Review `AGENTS_NOTES.md` with the team; confirm all entries are clear before proceeding | Reviewed notes | Day 1, Block 1 output |
| 11:45–13:00 | Review `ARCHITECTURE.md`; verify the existing codebase against each of the 6 key invariants below. Record pass/fail for each: **(1)** All writes go through services — never query directly from controllers. **(2)** All queries are parameterized — no string concatenation. **(3)** JWT required on every protected endpoint. **(4)** RBAC enforced at route level via middleware. **(5)** Asset ID generated server-side from SHA-256 hash. **(6)** Ticket history records every state change immutably | Architecture alignment checklist (6 invariants, pass/fail) | Day 1, Block 2 handoff |
| 13:00–14:30 | [LUNCH] | — | — |
| 14:30–14:45 | **Handoff & Review:** Review architecture checklist results; confirm any failures are understood before audit begins | Validated checklist | Day 1, Block 2 output |
| 14:45–16:15 | Audit all files in `backend/services/` and `backend/controllers/` against AGENTS.md rules (security, error handling, pagination, conventions). Record findings in the Gap Analysis Report using the required columns: `File Path`, `Rule Violated`, `Severity (High/Med/Low)`, `Evidence/Line Reference` | `GAP_ANALYSIS_REPORT.md` (completed) | Day 1, Block 3 handoff |
| 16:15–17:45 | Finalise AGENTS.md v1.0: resolve ambiguities using `AGENTS_NOTES.md` (from Block 1) as the primary input, prioritising the resolution of 'High' severity gaps identified in the `GAP_ANALYSIS_REPORT.md` (from Block 3). Commit the final version. | Final `AGENTS.md` v1.0 committed | Day 1, Blocks 1 & 3 outputs |

**Milestone M1:** `AGENTS.md` v1.0 approved, committed, and all ambiguities resolved.

---

#### Day 2 — Schema Finalisation (6 hours)
| Time | Task | Deliverable | Dependency |
|------|------|-------------|------------|
| 10:00–12:00 | Read `DATA_MODEL.md` fully; cross-reference with existing `docs/Database_Schema.md` (MSSQL) | Schema diff matrix | None |
| 12:00–13:00 | Identify MSSQL→PostgreSQL type mappings; document any constraint gaps | Migration mapping table | Day 2, Block 1 |
| 13:00–14:30 | [LUNCH] | — | — |
| 14:30–16:30 | Finalise PostgreSQL schema DDL; ensure all UNIQUE, FK, CHECK constraints are specified | `docs/PostgreSQL_Schema_DDL.sql` | Day 2, Block 2 |
| 16:30–17:30 | Update `DATA_MODEL.md` with final schema; add index recommendations | Final DATA_MODEL.md v1.0 | Day 2, Block 3 |

**Milestone M2:** PostgreSQL schema DDL complete and DATA_MODEL.md updated.

---

#### Day 3 — User Workflow Definition (6 hours)
| Time | Task | Deliverable | Dependency |
|------|------|-------------|------------|
| 10:00–12:00 | Read `docs/FLOWS/user-flows.md`; map each flow to existing frontend pages | Flow-to-page traceability matrix | None |
| 12:00–13:00 | Identify gaps: flows that don't match existing UI or are missing entirely | Gap report | Day 3, Block 1 |
| 13:00–14:30 | [LUNCH] | — | — |
| 14:30–16:30 | Refine user flows with detailed step-by-step UI interactions (button clicks, form validations, error states) | Enhanced user-flows.md v1.1 | Day 3, Block 2 |
| 16:30–17:30 | Add Mermaid diagrams for each flow; validate against PRD acceptance criteria | Diagrams + validation report | Day 3, Block 3 |

**Milestone M3:** User workflows complete with Mermaid diagrams and UI interaction details.

---

#### Day 4 — PRD Refinement (6 hours)
| Time | Task | Deliverable | Dependency |
|------|------|-------------|------------|
| 10:00–12:00 | Review `docs/PRD/PRD-auth-users.md`; verify acceptance criteria are testable and complete | Auth PRD review notes | None |
| 12:00–13:00 | Review `docs/PRD/PRD-inventory.md`; validate data model references and API contracts | Inventory PRD review notes | None |
| 13:00–14:30 | [LUNCH] | — | — |
| 14:30–16:30 | Review `docs/PRD/PRD-ticketing.md`; confirm status workflow matches schema constraints | Ticketing PRD review notes | None |
| 16:30–17:30 | Review `docs/PRD/PRD-reports.md` and `PRD-settings.md`; check for cross-PRD dependencies | Reports + Settings PRD review notes | None |

**Milestone M4:** All 5 PRDs reviewed; gap list compiled.

---

#### Day 5 — PRD Finalisation & Implementation Plan (7 hours)
| Time | Task | Deliverable | Dependency |
|------|------|-------------|------------|
| 10:00–12:00 | Address all gaps from Day 4 reviews; refine PRD scope, acceptance criteria, API contracts | Updated PRDs v1.1 | Day 4 |
| 12:00–13:00 | Resolve cross-PRD dependencies (e.g., auth PRD must align with user management PRD) | Dependency resolution matrix | Day 5, Block 1 |
| 13:00–14:30 | [LUNCH] | — | — |
| 14:30–16:30 | Update `docs/IMPLEMENTATION_INSTRUCTIONS.md` with refined task breakdown, acceptance criteria, and verification steps | Final Implementation Instructions v1.0 | Day 5, Block 3 |
| 16:30–17:30 | Create task checklist for Phase 1 (Tasks 1.1–1.4) with clear ownership and estimated hours | Phase 1 task board | Day 5, Block 4 |

**Milestone M5:** All PRDs finalised; Implementation Instructions complete; Phase 1 task board ready.

---

### Week 2: Validation & Phase 1 Readiness (Days 6–10)

#### Day 6 — Database Schema Validation (7 hours)
| Time | Task | Deliverable | Dependency |
|------|------|-------------|------------|
| 10:00–12:00 | Write PostgreSQL migration script (`backend/scripts/migrate_to_postgres.js`) using `pg` driver | Migration script v1 | Day 2 (DDL) |
| 12:00–13:00 | Test migration script against local PostgreSQL instance; verify all constraints created | Test report | Day 6, Block 1 |
| 13:00–14:30 | [LUNCH] | — | — |
| 14:30–16:30 | Update `backend/config/db.js` to use `pg` pool; verify connection string format | Updated db.js | Day 6, Block 2 |
| 16:30–17:30 | Document migration rollback procedure; add to `docs/Local_Host_Setup_Guide.md` | Rollback docs | Day 6, Block 3 |

**Milestone M6:** PostgreSQL migration script tested and documented.

---

#### Day 7 — Authentication Implementation (7 hours)
| Time | Task | Deliverable | Dependency |
|------|------|-------------|------------|
| 10:00–12:00 | Update `backend/services/authService.js` for PostgreSQL syntax; support email OR username login | Auth service v2 | Day 6 (db.js) |
| 12:00–13:00 | Update `backend/controllers/authController.js`; verify JWT payload structure | Auth controller v2 | Day 7, Block 1 |
| 13:00–14:30 | [LUNCH] | — | — |
| 14:30–16:30 | Test login flow end-to-end: POST /api/auth/login → JWT return → protected endpoint access | Login test report | Day 7, Block 2 |
| 16:30–17:30 | Verify RBAC middleware blocks unauthorized access per role matrix | RBAC test report | Day 7, Block 3 |

**Milestone M7:** Authentication system working with PostgreSQL; RBAC verified.

---

#### Day 8 — User Management Implementation (7 hours)
| Time | Task | Deliverable | Dependency |
|------|------|-------------|------------|
| 10:00–12:00 | Update `backend/services/userService.js` for PostgreSQL; implement CRUD operations | User service v2 | Day 6 (db.js) |
| 12:00–13:00 | Update `backend/controllers/userController.js`; add pagination support | User controller v2 | Day 8, Block 1 |
| 13:00–14:30 | [LUNCH] | — | — |
| 14:30–16:30 | Update `backend/routes/userRoutes.js`; protect with auth + RBAC(["Admin"]) | User routes v2 | Day 8, Block 2 |
| 16:30–17:30 | Test user CRUD: create, read, update, activate/deactivate; verify password hashing | User management test report | Day 8, Block 3 |

**Milestone M8:** User management fully functional with PostgreSQL.

---

#### Day 9 — Inventory & Ticketing Implementation (7 hours)
| Time | Task | Deliverable | Dependency |
|------|------|-------------|------------|
| 10:00–12:00 | Update `backend/services/inventoryService.js` for PostgreSQL; preserve Asset ID generation | Inventory service v2 | Day 6 (db.js) |
| 12:00–13:00 | Update `backend/controllers/inventoryController.js`; verify validation chains | Inventory controller v2 | Day 9, Block 1 |
| 13:00–14:30 | [LUNCH] | — | — |
| 14:30–16:30 | Update `backend/services/ticketService.js` for PostgreSQL; implement ticket_history audit trail | Ticket service v2 | Day 6 (db.js) |
| 16:30–17:30 | Update `backend/controllers/ticketController.js`; verify status workflow and RBAC | Ticket controller v2 | Day 9, Block 2 |

**Milestone M9:** Inventory and Ticketing services migrated to PostgreSQL.

---

#### Day 10 — Integration Testing & Documentation (7 hours)
| Time | Task | Deliverable | Dependency |
|------|------|-------------|------------|
| 10:00–12:00 | Run full integration test suite: auth → users → inventory → tickets | Test results report | Day 7–9 |
| 12:00–13:00 | Fix any failing tests; document known issues | Fixed test suite | Day 10, Block 1 |
| 13:00–14:30 | [LUNCH] | — | — |
| 14:30–16:30 | Update `docs/Local_Host_Setup_Guide.md` with PostgreSQL setup instructions | Updated setup guide | Day 10, Block 3 |
| 16:30–17:30 | Final review of all documentation; commit all changes; create Phase 2 task board | Phase 2 ready | Day 10, Block 4 |

**Milestone M10:** All Phase 1 tasks complete; documentation finalised; Phase 2 ready to start.

---

## 3. Dependency Map

```
Day 1 (AGENTS.md) ──→ Day 2 (Schema) ──→ Day 6 (Migration Script) ──→ Day 7–9 (Implementation)
Day 3 (Workflows) ──→ Day 4 (PRD Review) ──→ Day 5 (PRD Final) ──→ Day 10 (Integration)
Day 5 (Impl. Instructions) ──→ Day 7–9 (Implementation)
```

**Critical path:** Day 1 → Day 2 → Day 6 → Day 7 → Day 8 → Day 9 → Day 10

---

## 4. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| PostgreSQL installation issues | Blocks Days 2, 6–10 | Install PostgreSQL on Day 1 afternoon; verify connectivity before Day 2 |
| Schema constraint mismatches | Blocks Day 6 migration | Thorough schema review on Day 2; test DDL on Day 5 before migration script |
| RBAC logic errors | Security vulnerability | Manual RBAC audit on Day 7; test every role combination |
| PRD scope creep | Delays Phase 1 | Strict scope enforcement; log out-of-scope items for Phase 2 backlog |

---

## 5. Success Criteria

By end of Day 10, the following must be true:
- [ ] AGENTS.md, ARCHITECTURE.md, DATA_MODEL.md, FLOWS/, PRD/ all finalised and committed
- [ ] PostgreSQL migration script tested and documented
- [ ] Authentication system working with PostgreSQL (login, JWT, RBAC)
- [ ] User management CRUD complete
- [ ] Inventory and Ticketing services migrated
- [ ] Integration test suite passing
- [ ] Phase 2 task board created with clear acceptance criteria

---

## 6. Next Steps

1. **Today:** Begin Day 1 tasks — read AGENTS.md, audit existing codebase
2. **Daily standup:** 10:00 AM — review progress, blockers, plan for the day
3. **End of day:** Commit all work; update this plan with actual vs. estimated hours
4. **Day 5 review:** Stakeholder sign-off on PRDs before proceeding to implementation
