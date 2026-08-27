/**
 * PostgreSQL Schema Migration — Rollback Script
 *
 * Drops all application tables and sequences in reverse dependency order.
 * Safe to run multiple times (IF EXISTS guards prevent errors).
 *
 * Usage:
 *   cd backend && node scripts/rollback_postgres.js
 *
 * WARNING: This will DELETE ALL DATA in the application tables.
 */

require("dotenv").config();
const { Client } = require("pg");

const main = async () => {
  try {
    const host = process.env.DB_HOST || "localhost";
    const port = Number(process.env.DB_PORT || 5432);
    const database = process.env.DB_NAME || "office_management";
    const user = process.env.DB_USER || "postgres";
    const password = process.env.DB_PASSWORD || "";

    console.log("PostgreSQL Rollback Script");
    console.log(`  Host:     ${host}:${port}`);
    console.log(`  Database: ${database}`);
    console.log("");

    const client = new Client({ host, port, database, user, password });
    await client.connect();
    console.log("Connected.");
    console.log("");

    // Drop in reverse dependency order (children first, then parents)
    const dropStatements = [
      "DROP TABLE IF EXISTS ticket_history CASCADE",
      "DROP TABLE IF EXISTS tickets CASCADE",
      "DROP TABLE IF EXISTS inventory CASCADE",
      "DROP TABLE IF EXISTS users CASCADE",
      "DROP TABLE IF EXISTS lookup_values CASCADE",
      "DROP SEQUENCE IF EXISTS inventory_sr_no_seq CASCADE",
    ];

    for (const stmt of dropStatements) {
      console.log(`  Executing: ${stmt}`);
      await client.query(stmt);
    }

    // Verify tables are gone
    const remaining = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    if (remaining.rows.length === 0) {
      console.log("");
      console.log("All application tables dropped successfully.");
      console.log("Database is clean. You can re-run migrate_to_postgres.js to recreate.");
    } else {
      console.log("");
      console.warn("Some tables still exist:", remaining.rows.map((r) => r.table_name).join(", "));
    }

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error("FATAL ERROR:", err.message);
    process.exit(1);
  }
};

main();
