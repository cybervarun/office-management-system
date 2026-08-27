# CHECKPOINT — 2026-08-27 (Day 7)

## Session Summary

Week 2 Day 7 — Full PostgreSQL migration complete. Auth, RBAC, all service layers, controllers, and scripts migrated from SQL Server (mssql) to PostgreSQL (pg).

## Commits in this session

| Commit | Message |
|--------|---------|
| `5387413` | Day 7: Full PostgreSQL migration — auth, RBAC, services, scripts |
| `3694504` | Day 6: PostgreSQL migration tested and documented |
| `5c1e1d7` | Day 6: PostgreSQL migration infrastructure |

## What was delivered

### Day 6 (completed in prior session)
- `backend/scripts/migrate_to_postgres.js` — full schema migration script
- `backend/scripts/rollback_postgres.js` — safe rollback script
- `backend/config/db.js` — `pg` pool with lazy init, dotenv absolute path fix
- `docs/Local_Host_Setup_Guide.md` — rewritten for PostgreSQL
- `docs/PostgreSQL_Schema_DDL.sql` — complete schema (5 tables, 47 CHECK constraints, 21 indexes, seed data)

### Day 7 (this session)
- **authService.js** — `@email` → `$1`, `result.recordset[0]` → `result.rows[0]`
- **userService.js** — all `sql.NVarChar`/`sql.Int` → positional params, `BIT`→`boolean`
- **inventoryService.js** — `TOP N` → `LIMIT`, `OUTPUT INSERTED.*` → `RETURNING`, parameterized queries
- **ticketService.js** — `RETURNING *` pattern, parameterized UPDATEs
- **New: dashboardService.js** — PostgreSQL-native (`LIMIT 5`, `NOW()`)
- **New: reportsService.js** — `DATE(created_at)`, `INTERVAL '30 days'`, `LIMIT/OFFSET`
- **New: settingsService.js** — pure service layer, no DB calls beyond role stats
- **Controllers** — refactored to use service layer exclusively, all MSSQL patterns removed
- **create_admin.js** — `sql.NVarChar`/`sql.Int`→`$1-$4`, `BIT→boolean`, `SYSUTCDATETIME→NOW()`
- **seed.js** — `OUTPUT→RETURNING`, `TOP→LIMIT`, `DATEADD→INTERVAL`, parameterized values
- **check-schema.cjs** — `mssql→pg Client`, `recordset→rows`
- **stub_preload.js** — test stub for dependency injection (no live DB needed for unit tests)
- **package-lock.json** — `mssql` dependency removed, `pg` retained

## Verification results

| Test | Result |
|------|--------|
| DB connection tests | 14/14 PASS |
| Migration (tables) | 5/5 created |
| CHECK constraints | 47/47 verified |
| Indexes | 21/21 verified |
| Seed data | 1 admin user created |
| Frontend build | clean (2.83s) |
| No MSSQL patterns in source | confirmed (grep: zero matches) |

## PostgreSQL specifics applied

| MSSQL | PostgreSQL |
|-------|-----------|
| `@param` named params | `$1, $2, $3` positional |
| `result.recordset[0]` | `result.rows[0]` |
| `sql.NVarChar(n)` | removed (positional only) |
| `TOP 5` | `LIMIT 5` |
| `OUTPUT INSERTED.*` | `RETURNING *` |
| `BIT 1/0` | `BOOLEAN true/false` |
| `DATETIME2` | `TIMESTAMPTZ` |
| `IDENTITY(1,1)` | `SERIAL` |
| `SYSUTCDATETIME()` | `NOW()` |
| `DATEADD(day, -30, ...)` | `NOW() - INTERVAL '30 days'` |
| `CONVERT(date, col)` | `DATE(col)` |
| `OFFSET 0 FETCH NEXT 10 ROWS ONLY` | `LIMIT 10 OFFSET 0` |
| `mssql` driver | `pg` (node-postgres) |

## Known issues / notes

1. **Original PostgreSQL on port 5432** — password unknown, inaccessible. Test instance on port 5433 used for all verification. `.env` currently has `DB_PORT=5433` — this is a temporary workaround. Should be documented as a known issue.
2. **mssql dependency** — removed from package.json but `package-lock.json` may still reference it transitively in some resolutions. The actual runtime only uses `pg`.
3. **No unit test runner** — the project uses inline `npm run test-db` and `e2e-test.js`. No Jest/Mocha configured.

## Git status

All changes committed in `5387413`. Working tree clean.

## Next steps

- Week 2 Day 8: Integration testing — start backend + frontend, verify login flow against PostgreSQL
- Week 2 Day 9: End-to-end test coverage, frontend connectivity
- Fix `.env` to point to production PostgreSQL instance (port 5432) once password is resolved
