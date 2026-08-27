# PostgreSQL Connection & Pool Configuration

> **Generated:** 2026-08-25 · Day 4 Database Layer Migration
> **Replaces:** `mssql` ConnectionPool → `pg` Pool

---

## Package Change

| Before | After |
|--------|-------|
| `mssql` (Microsoft SQL Server driver) | `pg` (node-postgres) |

Install with:
```bash
cd backend && npm install pg
npm uninstall mssql
```

---

## Connection Parameters

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | ✅ | — | PostgreSQL server hostname or IP |
| `DB_PORT` | ❌ | `5432` | PostgreSQL TCP port |
| `DB_NAME` | ✅ | — | Database name |
| `DB_USER` | ✅ | — | Database user |
| `DB_PASSWORD` | ✅ | — | Database password |

All five required variables are validated at startup — the process **crashes with a fatal error** if any are missing.

---

## Pool Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_POOL_MAX` | `20` | Maximum connections in the pool |
| `DB_POOL_MIN` | `0` | Minimum idle connections to maintain |
| `DB_POOL_TIMEOUT` | `10000` ms | Time before an idle connection is destroyed |
| `DB_CONNECTION_TIMEOUT` | `5000` ms | Time waiting for a connection from the pool |

---

## Exported API

```javascript
const { pool, executeQuery, executeTransaction, getPool, logConnectionTarget } = require("../config/db");

// executeQuery(text, values)   — parameterized query, auto-claims/releases a client
// executeTransaction(fn)       — BEGIN → fn(client) → COMMIT / ROLLBACK, auto-claims/releases
// getPool()                    — returns the raw Pool instance
// logConnectionTarget()        — logs connection string to console
```

### `executeQuery(text, values)`
Claims a client from the pool, executes the query, releases the client in a `finally` block.
Values are passed as a plain JS array: `[value1, value2]`.
SQL uses `$1, $2, $3` positional placeholders.

### `executeTransaction(fn)`
Claims a client, starts `BEGIN`, calls `fn(client)` with that client, then `COMMIT` on success
or `ROLLBACK` on exception. The client is always released.

### Accessing Results

| MSSQL (`mssql`) | PostgreSQL (`pg`) |
|-----------------|-------------------|
| `result.recordset` | `result.rows` |
| `result.rowsAffected[0]` | `result.rowCount` |
| `result.recordset[0]` | `result.rows[0]` |

---

## .env.example

See `backend/.env.example` for a complete documented template.
