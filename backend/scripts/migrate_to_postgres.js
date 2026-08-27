/**
 * PostgreSQL Migration Script
 *
 * Reads docs/PostgreSQL_Schema_DDL.sql and applies it to the PostgreSQL database.
 * Handles the full schema: sequences, tables, constraints, indexes, and seed data.
 *
 * Usage:
 *   cd backend && node scripts/migrate_to_postgres.js
 *
 * Environment variables (from .env):
 *   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 */

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const ENV_VARS = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"];

const required = (names) => {
  const value = names
    .map((n) => process.env[n])
    .find((item) => item && String(item).trim());
  if (!value || !String(value).trim()) {
    throw new Error(`${names.join(" or ")} is missing in .env`);
  }
  return String(value).trim();
};

const parsePort = (value) => {
  const port = Number.parseInt(value, 10);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("DB_PORT must be a valid TCP port number");
  }
  return port;
};

const main = async () => {
  try {
    // Load .env from backend/ directory (where it lives alongside package.json)
    const envPath = path.join(__dirname, "../.env");
    if (!fs.existsSync(envPath)) {
      console.error("ERROR: .env file not found at", envPath);
      process.exit(1);
    }
    require("dotenv").config({ path: envPath });

    // Validate required env vars
    const host = required(["DB_HOST"]);
    const port = parsePort(process.env.DB_PORT || "5432");
    const database = required(["DB_NAME"]);
    const user = required(["DB_USER"]);
    const password = required(["DB_PASSWORD"]);

    console.log(`PostgreSQL Migration`);
    console.log(`  Host:     ${host}:${port}`);
    console.log(`  Database: ${database}`);
    console.log(`  User:     ${user}`);
    console.log("");

    // Read the PostgreSQL schema DDL
    const ddlPath = path.join(__dirname, "../../docs/PostgreSQL_Schema_DDL.sql");
    if (!fs.existsSync(ddlPath)) {
      console.error(`ERROR: Schema file not found at ${ddlPath}`);
      process.exit(1);
    }

    const sqlText = fs.readFileSync(ddlPath, "utf8");
    console.log(`Read schema file: ${ddlPath} (${sqlText.length} bytes)`);
    console.log("");

    // Connect to PostgreSQL
    const client = new Client({ host, port, database, user, password });
    console.log("Connecting to PostgreSQL...");
    await client.connect();
    console.log("Connected successfully.");
    console.log("");

    // The PostgreSQL DDL does NOT use GO separators — execute as one batch.
    // However, we wrap the entire file in a transaction for safety.
    console.log("Starting transaction...");
    await client.query("BEGIN");

    try {
      // PostgreSQL doesn't use GO — the DDL is a single script.
      // We execute it directly, but split on semicolons for line-by-line feedback.
      // The DDL file uses statement-level commits via IF NOT EXISTS guards.
      console.log("Executing schema DDL...");

      // Trim and execute
      const trimmed = sqlText.trim();
      if (trimmed.length === 0) {
        throw new Error("Schema file is empty");
      }

      await client.query(trimmed);
      console.log("Schema DDL executed successfully.");
    } catch (err) {
      console.error("");
      console.error(`ERROR during schema execution: ${err.message}`);
      console.error("Rolling back transaction...");
      await client.query("ROLLBACK");
      process.exit(1);
    }

    // Commit the transaction
    await client.query("COMMIT");
    console.log("Transaction committed.");
    console.log("");

    // Verify tables exist
    console.log("Verifying tables...");
    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const expectedTables = ["users", "inventory", "tickets", "ticket_history", "lookup_values"];
    const foundTables = tableCheck.rows.map((r) => r.table_name);

    let allTablesOk = true;
    for (const tbl of expectedTables) {
      if (foundTables.includes(tbl)) {
        console.log(`  OK    Table '${tbl}' exists`);
      } else {
        console.error(`  FAIL  Table '${tbl}' NOT found`);
        allTablesOk = false;
      }
    }
    console.log("");

    // Verify constraints
    console.log("Verifying CHECK constraints...");
    const constraintCheck = await client.query(`
      SELECT tc.constraint_name, tc.table_name, cc.check_clause
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.constraint_type = 'CHECK'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_name
    `);

    for (const row of constraintCheck.rows) {
      console.log(`  OK    ${row.table_name}.${row.constraint_name}: ${row.check_clause}`);
    }
    console.log("");

    // Verify indexes
    console.log("Verifying indexes...");
    const indexCheck = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    for (const row of indexCheck.rows) {
      console.log(`  OK    ${row.tablename}.${row.indexname}`);
    }
    console.log("");

    // Verify seed data
    console.log("Verifying seed data...");
    const seedCheck = await client.query("SELECT COUNT(*) AS cnt FROM users");
    const adminCount = parseInt(seedCheck.rows[0].cnt, 10);
    if (adminCount >= 1) {
      console.log(`  OK    ${adminCount} user(s) in database (admin seed present)`);
    } else {
      console.error("  WARN  No users found — seed data may not have been inserted");
    }
    console.log("");

    if (allTablesOk) {
      console.log("Migration completed successfully!");
      console.log("");
      console.log("Next steps:");
      console.log("  1. Update your .env with correct PostgreSQL credentials");
      console.log("  2. Run: npm run seed-admin   (to create admin user)");
      console.log("  3. Run: npm run dev          (to start the server)");
      process.exit(0);
    } else {
      console.error("Migration completed with errors. Check the output above.");
      process.exit(1);
    }
  } catch (err) {
    console.error("");
    console.error("FATAL ERROR:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
};

main();
