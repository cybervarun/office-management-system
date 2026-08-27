/**
 * Global teardown — runs once after all test suites complete.
 * Cleans up test data to keep the DB clean.
 */
const { executeQuery } = require('../../backend/config/db');

async function teardown() {
  try {
    await executeQuery("DELETE FROM ticket_history");
    await executeQuery("DELETE FROM tickets");
    await executeQuery("DELETE FROM inventory");
  } catch (e) {
    // Tables may not exist or be empty
  }
}

module.exports = teardown;
