# Transaction Migration Patterns

> **Generated:** 2026-08-25 · Day 4 Database Layer Migration
> **Reference:** `backend/config/db.js` — `executeTransaction()`

---

## Background

MSSQL (`mssql` package) supports transactions via `new sql.Transaction(pool)` and `BEGIN TRAN` / `COMMIT` / `ROLLBACK`. PostgreSQL (`pg` package) uses a client-level approach: you claim a client from the pool, run `BEGIN` / `COMMIT` / `ROLLBACK` on that client, then release it.

---

## Pattern: `executeTransaction(fn)`

The `db.js` module exports `executeTransaction` for any multi-statement operation that must be atomic:

```javascript
const { executeTransaction } = require("../config/db");

// Usage:
const result = await executeTransaction(async (client) => {
  await client.query("BEGIN");
  try {
    const r1 = await client.query("INSERT INTO ... RETURNING id", [val]);
    const r2 = await client.query("INSERT INTO ticket_history ...", [r1.rows[0].id, ...]);
    await client.query("COMMIT");
    return r1.rows[0];
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  }
});
```

**Note:** The `executeTransaction` wrapper in `db.js` already handles `BEGIN`/`COMMIT`/`ROLLBACK`/client-release. Callers should pass a function that receives the `client` and performs queries directly on it — no manual `BEGIN`/`COMMIT` needed at the caller level.

---

## Current Transaction Usage in Services

After review, **no service file currently uses explicit transactions**. All multi-step operations (e.g., create ticket + insert history) use two sequential `executeQuery` calls. This is acceptable for the current workload but should be migrated to `executeTransaction` if:

1. A failure in the second query leaves the database in an inconsistent state
2. Concurrent access could cause race conditions

### Future migration path (e.g., `createTicket`):

```javascript
// Current (two separate queries — not atomic)
const ticket = await createTicket(payload, userId);
await logHistory(ticket.id, 'Created', ...);

// Migrated (atomic — both succeed or both roll back)
const ticket = await executeTransaction(async (client) => {
  const r = await client.query(
    `INSERT INTO tickets (...) VALUES (...) RETURNING *`, values
  );
  await client.query(
    `INSERT INTO ticket_history (...) VALUES (...)`, historyValues
  );
  return r.rows[0];
});
```

---

## CHECK Constraints (Database-Level Enforcement)

All CHECK constraints are defined in `docs/PostgreSQL_Schema_DDL.sql` and enforced by PostgreSQL automatically:

| Table | Constraint | Enforced Values |
|-------|-----------|-----------------|
| `users` | `chk_users_role` | `Admin, Help Desk, IT Team, Network Team, Cybersecurity` |
| `tickets` | `chk_tickets_status` | `Open, In Progress, Pending, Resolved, Closed` |
| `tickets` | `chk_tickets_team` | `IT Help Desk, IT Team, Network Team, Cybersecurity Team` |

No application-level validation is needed for these — the database rejects invalid values with a `check_violation` error. The service files already validate these at the application level (throwing `ApiError`) before reaching the database, providing clearer error messages.

---

## Foreign Key Handling

All FK relationships are defined in the DDL:

| Constraint | Referenced |
|-----------|------------|
| `tickets.created_by → users.id` | NOT NULL — must exist |
| `tickets.inventory_id → inventory.id` | NULLABLE — optional asset link |
| `ticket_history.ticket_id → tickets.id` | NOT NULL — must exist |
| `ticket_history.performed_by → users.id` | NOT NULL — must exist |

**onDelete behavior:**
- `tickets.created_by`: `ON DELETE RESTRICT` (default) — cannot delete a user who created tickets
- `tickets.inventory_id`: `ON DELETE SET NULL` — detaches ticket from asset if asset is deleted
- `ticket_history.ticket_id`: `ON DELETE CASCADE` — history rows deleted when ticket deleted
- `ticket_history.performed_by`: `ON DELETE RESTRICT` (default) — cannot delete user who performed history actions

The `deleteTicket` function in `ticketService.js` manually deletes history first to work around FK constraints, but with `ON DELETE CASCADE` on `ticket_history.ticket_id`, this manual deletion is no longer necessary after the DDL is applied.

---

## Special Case: Dynamic Column UPDATE (userService.js)

`userService.js::editUser` builds the SET clause dynamically based on which fields are present in the payload. This pattern works correctly with PostgreSQL because:

1. Column names are from a hardcoded allowlist — safe from SQL injection
2. Values are passed as positional parameters (`$1, $2, ...`) — safe from SQL injection
3. The final `WHERE id = $N` uses a parameterized integer

```javascript
// Safe pattern — column names from hardcoded array, values parameterized
const fields = ["name", "email", "phone", "role"]; // hardcoded allowlist
const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
await executeQuery(`UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1}`, [...values, id]);
```

---

## Rollback to MSSQL

To revert to MSSQL:
1. Revert `backend/config/db.js` from the git history
2. Revert all service files from git history
3. Replace `pg` dependency with `mssql` in `package.json`
4. Revert `scripts/create_admin.js` and `scripts/seed.js`
5. Run `npm install`
