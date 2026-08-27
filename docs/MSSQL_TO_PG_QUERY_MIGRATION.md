# MSSQL → PostgreSQL Query Migration Reference

> **Generated:** 2026-08-25 · Day 4 Database Layer Migration
> **Scope:** All service files + seed/create_admin scripts

---

## Syntax Change Catalogue

### 1. Parameter Syntax

| MSSQL (`mssql`) | PostgreSQL (`pg`) |
|-----------------|-------------------|
| `@paramName` | `$1, $2, $3` (positional) |
| `[{ name: "x", type: sql.NVarChar(50), value: val }]` | `[val]` |
| `request.input("x", sql.Int, val)` | positional array index |

**Rule:** Remove all `{ name, type, value }` parameter objects. Flatten to a plain array in the same order as `$N` placeholders.

### 2. TOP N → LIMIT N

| MSSQL | PostgreSQL |
|-------|------------|
| `SELECT TOP 5 * FROM t` | `SELECT * FROM t LIMIT 5` |
| `SELECT TOP 1 * FROM t WHERE ...` | `SELECT * FROM t WHERE ... LIMIT 1` |

### 3. Pagination

| MSSQL | PostgreSQL |
|-------|------------|
| `OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY` | `LIMIT $pageSize OFFSET $offset` |

### 4. Date/Time Functions

| MSSQL | PostgreSQL |
|-------|------------|
| `SYSUTCDATETIME()` | `NOW()` |
| `GETDATE()` | `NOW()` |
| `DATEADD(day, -30, SYSUTCDATETIME())` | `NOW() - INTERVAL '30 days'` |
| `CONVERT(date, created_at)` | `DATE(created_at)` |

### 5. OUTPUT Clause

| MSSQL | PostgreSQL |
|-------|------------|
| `INSERT INTO t (...) OUTPUT INSERTED.* VALUES (...)` | `INSERT INTO t (...) VALUES (...) RETURNING *` |
| `UPDATE t SET ... OUTPUT INSERTED.* WHERE ...` | `UPDATE t SET ... RETURNING * WHERE ...` |

### 6. Result Access

| MSSQL (`mssql`) | PostgreSQL (`pg`) |
|-----------------|-------------------|
| `result.recordset` | `result.rows` |
| `result.recordset[0]` | `result.rows[0]` |
| `result.rowsAffected[0]` | `result.rowCount` |
| `result.rowsAffected[0] > 0` | `result.rowCount > 0` |

### 7. ISNULL → COALESCE

| MSSQL | PostgreSQL |
|-------|------------|
| `ISNULL(col, default)` | `COALESCE(col, default)` |

### 8. Boolean Handling

| MSSQL | PostgreSQL |
|-------|------------|
| `sql.Bit` / `1` / `0` | `true` / `false` (boolean literals) |
| `is_active = 1` | `is_active = true` |

### 9. String Type Handling

| MSSQL | PostgreSQL |
|-------|------------|
| `sql.NVarChar(sql.MAX)` → TEXT | Direct `TEXT` or `VARCHAR(255)` |
| `sql.NVarChar(255)` | No type annotation needed — pass plain JS strings |

### 10. COUNT(*) OVER() Window Function

MSSQL used `COUNT(*) OVER() AS _totalCount` inside the main query to get the total alongside paginated rows. PostgreSQL equivalent requires a **separate count query**:

```sql
-- MSSQL (single query)
SELECT *, COUNT(*) OVER() AS _totalCount FROM t WHERE ... LIMIT 5 OFFSET 0

-- PostgreSQL (two queries)
SELECT COUNT(*) AS total FROM t WHERE ...   -- count query
SELECT * FROM t WHERE ... LIMIT 5 OFFSET 0  -- data query
```

---

## Files Migrated

| File | Queries Converted | Key Changes |
|------|-------------------|-------------|
| `authService.js` | 1 | `@email` → `$1`, `recordset[0]` → `rows[0]` |
| `userService.js` | 7 | Dynamic params rebuilt as `$N`; `OFFSET/FETCH` → `LIMIT/OFFSET`; `sql.Bit` → boolean; `COUNT(*) OVER()` → separate count |
| `inventoryService.js` | 10 | `TOP N` → `LIMIT N`; `OUTPUT` → `RETURNING`; dynamic params rebuilt; `COUNT(*) OVER()` → separate count; `getDropdownValues` restructured to avoid dynamic column interpolation |
| `ticketService.js` | 9 | `TOP N` → `LIMIT N`; `OUTPUT` → `RETURNING`; `SYSUTCDATETIME()` → `NOW()`; dynamic params rebuilt |
| `dashboardService.js` | 7 | `TOP 5` → `LIMIT 5`; `recordset` → `rows`; `result[0].cnt` → optional chaining |
| `reportsService.js` | 8 | `OFFSET/FETCH` → `LIMIT/OFFSET`; `CONVERT(date, ...)` → `DATE(...)`; `DATEADD` → `INTERVAL`; `recordset` → `rows` |
| `settingsService.js` | 1 | `recordset` → `rows` |
| `scripts/create_admin.js` | 2 | `@param` → `$N`; `recordset[0]` → `rows[0]`; `SYSUTCDATETIME()` → `NOW()`; `is_active = 1` → `is_active = true` |
| `scripts/seed.js` | 3 | `@param` → `$N`; `OUTPUT INSERTED.id` → `RETURNING id`; `recordset[0]` → `rows[0]`; type annotations removed |
| `scripts/apply_schema.js` | 0 (no change) | Now reads from `PostgreSQL_Schema_DDL.sql` instead of `schema.sql` |

**Total service files migrated:** 7  
**Total script files migrated:** 2  
**Total queries converted:** ~40

---

## db.js API Changes

### Before (MSSQL)
```javascript
const { executeQuery, sql, pool, poolConnect } = require("./config/db");
await executeQuery("SELECT * FROM t WHERE id = @id", [{ name: "id", type: sql.Int, value: 1 }]);
const result = await poolConnect; // wait for initial connection
```

### After (PostgreSQL)
```javascript
const { executeQuery, executeTransaction, pool, getPool } = require("./config/db");
await executeQuery("SELECT * FROM t WHERE id = $1", [1]);
// executeTransaction(fn) for multi-statement transactions
// getPool() for raw pool access
```

---

## package.json Dependency Change

```diff
- "mssql": "^12.5.2"
+ "pg": "^8.13.0"
```

Install: `cd backend && npm install && npm uninstall mssql`
