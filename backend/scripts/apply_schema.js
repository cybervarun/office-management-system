const fs = require("fs");
const path = require("path");
const { executeQuery } = require("../config/db");

(async () => {
  try {
    const sqlText = fs.readFileSync(
      path.join(__dirname, "../../docs/PostgreSQL_Schema_DDL.sql"),
      "utf8"
    );

    // The PostgreSQL DDL is a single script — execute it as-is.
    // If the file contained GO separators (MSSQL-style), we'd split on them,
    // but the target DDL is already pure PostgreSQL.
    const trimmed = sqlText.trim();
    if (trimmed.length === 0) {
      throw new Error("Schema file is empty");
    }

    console.log("Applying PostgreSQL schema from docs/PostgreSQL_Schema_DDL.sql...");
    await executeQuery(trimmed);
    console.log("Schema applied successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Failed to apply schema:", err);
    process.exit(1);
  }
})();
