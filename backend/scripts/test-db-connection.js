/**
 * PostgreSQL Connection & Feature Test Script
 *
 * Tests:
 * 1. Pool connection
 * 2. Basic SELECT on all tables
 * 3. INSERT / RETURNING
 * 4. UPDATE
 * 5. Transaction rollback
 * 6. Connection release
 *
 * Usage:
 *   cd backend && DB_HOST=localhost DB_NAME=it_inventory DB_USER=postgres DB_PASSWORD=yourpass \
 *   node scripts/test-db-connection.js
 */

const { executeQuery, executeTransaction, getPool, logConnectionTarget } = require("../config/db");

let passed = 0;
let failed = 0;

const assert = async (cond, msg) => {
  if (cond) {
    passed++;
    console.log(`  PASS  ${msg}`);
  } else {
    failed++;
    console.error(`  FAIL  ${msg}`);
  }
};

const section = (title) => {
  console.log(`\n=== ${title} ===`);
};

const main = async () => {
  try {
    logConnectionTarget();

    // 1. Pool test
    section("1. Connection Pool");
    const pool = await getPool();
    await assert(pool && typeof pool.connect === "function", "Pool obtained from getPool()");

    // 2. Basic SELECT
    section("2. SELECT queries");
    const r1 = await executeQuery("SELECT 1 + 1 AS result");
    await assert(
      r1.rows[0]?.result === 2,
      "Arithmetic query returns correct result"
    );

    // 3. Table existence check
    section("3. Table existence");
    const tables = ["users", "inventory", "tickets", "ticket_history", "lookup_values"];
    for (const tbl of tables) {
      const r = await executeQuery(
        `SELECT COUNT(*) AS cnt FROM ${tbl}`
      );
      const cnt = r.rows[0]?.cnt;
      await assert(
        cnt !== undefined && cnt !== null,
        `Table '${tbl}' is accessible`
      );
    }

    // 4. INSERT + RETURNING
    section("4. INSERT with RETURNING");
    const insertR = await executeQuery(
      `INSERT INTO users (name, email, phone, role, password_hash, is_active)
       VALUES ($1, $2, NULL, $3, $4, true)
       RETURNING id, name, email`,
      ["Test User", "test-pg-conn@example.com", "Admin", "stub-hash"]
    );
    await assert(
      insertR.rows[0] && insertR.rows[0].id,
      "INSERT RETURNING returns id and email"
    );
    const newId = insertR.rows[0]?.id;
    await assert(
      insertR.rows[0]?.email === "test-pg-conn@example.com",
      "INSERT RETURNING returns correct email"
    );

    // 5. UPDATE
    section("5. UPDATE");
    const updateR = await executeQuery(
      "UPDATE users SET name = $1 WHERE id = $2 RETURNING name, updated_at",
      ["Updated User", newId]
    );
    await assert(
      updateR.rows[0]?.name === "Updated User",
      "UPDATE returns correct new name"
    );
    await assert(
      updateR.rowCount === 1,
      "UPDATE affects exactly 1 row"
    );

    // 6. Transaction rollback
    section("6. Transaction rollback");
    const beforeCnt = (await executeQuery("SELECT COUNT(*) AS cnt FROM users")).rows[0]?.cnt;
    await executeTransaction(async (client) => {
      await client.query("INSERT INTO users (name, email, role, password_hash, is_active) VALUES ($1, $2, $3, $4, true)",
        ["Rollback User", "rollback@example.com", "Admin", "hash"]);
      throw new Error("Intentional rollback");
    }).catch(() => {});
    const afterCnt = (await executeQuery("SELECT COUNT(*) AS cnt FROM users")).rows[0]?.cnt;
    await assert(
      afterCnt === beforeCnt,
      "Transaction rollback leaves no side effects (row count unchanged)"
    );

    // 7. Cleanup test user
    await executeQuery("DELETE FROM users WHERE email = $1", ["test-pg-conn@example.com"]);
    await executeQuery("DELETE FROM users WHERE email = $1", ["rollback@example.com"]);

    // 8. Positional param safety
    section("7. Positional parameter safety");
    const safeR = await executeQuery(
      "SELECT name FROM users WHERE name = $1",
      ["'; DROP TABLE users; --"]
    );
    await assert(
      safeR.rows.length === 0,
      "Malicious input is parameterized safely (no rows match)"
    );

    // 9. Connection release
    section("8. Connection pool release");
    await executeQuery("SELECT 1");
    await executeQuery("SELECT 2");
    await executeQuery("SELECT 3");
    await assert(true, "Multiple sequential queries succeed without pool exhaustion");

    // Summary
    section("Summary");
    console.log(`  Passed: ${passed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Total:  ${passed + failed}`);

    if (failed > 0) {
      console.log("\n⚠️  Some tests failed. Check your PostgreSQL connection settings.");
      process.exit(1);
    } else {
      console.log("\n✓  All PostgreSQL connection tests passed!");
      process.exit(0);
    }
  } catch (err) {
    console.error("\n✗  Fatal error:", err.message);
    process.exit(1);
  }
};

main();
