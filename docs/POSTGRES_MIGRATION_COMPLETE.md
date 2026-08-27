# PostgreSQL Migration Complete

> **Date:** 2026-08-25 · Day 4 Database Layer Migration
> **Status:** ✅ Migration Complete
> **Driver:** `pg` (node-postgres) v8.23.0

---

## Summary

The backend has been fully migrated from **MSSQL (mssql)** to **PostgreSQL (pg)**. All service files, scripts, and configuration have been updated.

---

## Files Modified

### Core Config
| File | Change |
|------|--------|
| `backend/config/db.js` | Rewritten — `pg` Pool with lazy env validation, `executeQuery`, `executeTransaction`, `getPool` |
| `backend/package.json` | `mssql` → `pg` dependency |

### Service Layer
| File | Queries Migrated |
|------|-----------------|
| `backend/services/authService.js` | 1 query — login |
| `backend/services/userService.js` | 5 queries — list, get, edit, delete, search |
| `backend/services/inventoryService.js` | 8 queries — CRUD + search + dropdowns |
| `backend/services/ticketService.js` | 7 queries — CRUD + history + search |
| `backend/services/dashboardService.js` | 3 queries — stats + recent |
| `backend/services/reportsService.js` | 4 queries — generation + export |
| `backend/services/settingsService.js` | 2 queries — get/set |

### Scripts
| File | Change |
|------|--------|
| `backend/scripts/create_admin.js` | All `@param` → `$N`, `recordset` → `rows`, removed `sql` import |
| `backend/scripts/seed.js` | All `@param` → `$N`, `OUTPUT` → `RETURNING`, removed `sql` annotations |
| `backend/scripts/apply_schema.js` | Now reads from `../../docs/PostgreSQL_Schema_DDL.sql` |
| `backend/scripts/check-schema.cjs` | Rewritten with `pg` Client |

### Tests
| File | Change |
|------|--------|
| `backend/scripts/__tests__/create_admin.test.js` | Rewritten — `--require` preload stub for pg/db |
| `backend/scripts/__tests__/stub_preload.js` | New — child-process module stub for tests |
| `backend/scripts/test-db-connection.js` | New — integration test script |

### Documentation
| File | Created |
|------|---------|
| `backend/.env.example` | PostgreSQL env var reference |
| `docs/DB_MIGRATION_CONFIG.md` | Connection pool & API reference |
| `docs/MSSQL_TO_PG_QUERY_MIGRATION.md` | Full syntax change catalogue |
| `docs/TRANSACTION_MIGRATION.md` | Transaction patterns & special cases |
| `docs/POSTGRES_MIGRATION_COMPLETE.md` | This file |

---

## Syntax Changes Applied

| MSSQL | PostgreSQL |
|-------|-----------|
| `@param` named | `$1, $2, $3` positional |
| `sql.Bit` with `1`/`0` | Native `true`/`false` |
| `TOP N` | `LIMIT N` |
| `OFFSET ... FETCH NEXT ... ROWS ONLY` | `LIMIT N OFFSET N` |
| `COUNT(*) OVER() AS _totalCount` | Separate count query |
| `OUTPUT INSERTED.*` | `RETURNING *` |
| `OUTPUT INSERTED.id` | `RETURNING id` |
| `SYSUTCDATETIME()` | `NOW()` |
| `CONVERT(date, x)` | `DATE(x)` |
| `DATEADD(day, -30, x)` | `x - INTERVAL '30 days'` |
| `ISNULL(x, y)` | `COALESCE(x, y)` |
| `result.recordset` | `result.rows` |
| `result.recordset[0]` | `result.rows[0]` |
| `result.rowsAffected[0]` | `result.rowCount` |
| `new sql.Transaction(pool)` | `executeTransaction(fn)` wrapper |
| `request.input(name, type, value)` | Positional values array |
| `NVARCHAR` | `VARCHAR` |
| `DATETIME2` | `TIMESTAMPTZ` |
| `IDENTITY(1,1)` | `SERIAL` |
| `BIT` | `BOOLEAN` |

---

## Migration Statistics

| Metric | Count |
|--------|-------|
| Service files migrated | 7 |
| Script files migrated | 4 |
| Total queries converted | ~40 |
| Transaction patterns migrated | 0 (no explicit transactions existed) |
| Test files created/updated | 3 |
| Documentation files created | 4 |

---

## Known Issues / Edge Cases

1. **Dynamic UPDATE in `userService.js::editUser`**: Column names come from a hardcoded allowlist — safe from SQL injection. Values are parameterized.
2. **Pagination**: MSSQL used `COUNT(*) OVER()` window function; PostgreSQL requires a separate count query. All services updated.
3. **`getDropdownValues`**: Restructured to avoid dynamic column interpolation — uses hardcoded field allowlist with separate queries.
4. **Lazy env validation**: `db.js` defers env var checks until first connection attempt, allowing tests to stub without real env vars.

---

## Rollback Plan

To revert to MSSQL:
1. `git revert` the migration commits
2. `npm uninstall pg && npm install mssql@^12.5.2`
3. Revert `backend/config/db.js` to MSSQL version
4. Revert all service files and scripts
5. Update `docs/PostgreSQL_Schema_DDL.sql` reference back to `schema.sql`

---

## Verification Commands

```bash
# Run connection tests
cd backend && node scripts/test-db-connection.js

# Run create_admin guard tests
cd backend && node scripts/__tests__/create_admin.test.js

# Check schema against DDL
cd backend && node scripts/check-schema.cjs

# Verify build
cd backend && npm run dev &  # ensure no import errors
```
