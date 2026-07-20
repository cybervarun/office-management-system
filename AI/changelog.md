# AI Changelog

- 2026-05-27 — Manager: Initialized `/AI` folder and tracking files (team_roster, dashboard, task_board, changelog).
- 2026-05-27 — Manager: Created `.agent.md` defining the Orchestrator-Agent and delegation rules.
- 2026-05-27 — Manager: User approved sub-agent autonomy (allowed). Logged policy and changelog requirement.
- 2026-05-27 — Manager: Created sub-agent files (Frontend, Backend, DevOps, QA, Docs) under `AI/agents/`.
- 2026-05-27 — Manager: `/init` command processed; confirmed AI folder, agents, and tracking docs.
- 2026-05-27 — Backend-Agent: Ran `scripts/create_admin.js` to seed admin user (`admin@local`).
- 2026-05-27 — Backend-Agent: Relaxed email validation (`require_tld: false`) in auth/user/inventory routes to support local login usernames.
- 2026-05-27 — Frontend-Agent: Updated login page to display backend validation details rather than generic failure.
- 2026-05-27 — Phase 2 Fix 1: Backend-Agent added security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS) and production CORS config to `backend/app.js`.
- 2026-05-27 — Phase 2 Fix 2: Backend-Agent improved env var fallbacks in `backend/config/db.js` with multiple aliases (DB_PASS, SA_PASSWORD, MSSQL_SA_PASSWORD) and pool config params.
- 2026-05-27 — Phase 2 Fix 3: DevOps-Agent added production scripts (`prod`, `init-db`, `seed-admin`) to backend and frontend package.json.
