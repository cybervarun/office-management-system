const fs = require('fs');
const path = require('path');
const { executeQuery } = require('../config/db');

(async () => {
  try {
    const sqlText = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    // Split on lines that contain only GO (case-insensitive)
    const parts = sqlText.split(/^\s*GO\s*$/gim).map(p => p.trim()).filter(Boolean);
    for (const [i, part] of parts.entries()) {
      console.log(`Executing part ${i + 1}/${parts.length}...`);
      try {
        await executeQuery(part);
        console.log(`Part ${i + 1} executed successfully.`);
      } catch (err) {
        console.error(`Error executing part ${i + 1}:`, err.message || err);
        // continue to next part
      }
    }
    console.log('Done applying schema.sql');
    process.exit(0);
  } catch (err) {
    console.error('Failed to apply schema:', err);
    process.exit(1);
  }
})();
