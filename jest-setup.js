/**
 * Jest global setup — one-time DB seeding before any integration test runs.
 * Creates a reusable test admin and test users so each spec file starts
 * with a known-authenticated baseline without hitting the network.
 */
const bcrypt = require('bcryptjs');
const { executeQuery } = require('./backend/config/db');

const TEST_PASSWORD = 'TestPass@123';
const TEST_ADMIN_EMAIL = 'itest-admin@example.com';
const TEST_USER_EMAIL = 'itest-user@example.com';

async function seed() {
  // Ensure test admin exists
  const existing = await executeQuery(
    'SELECT id FROM users WHERE email = $1',
    [TEST_ADMIN_EMAIL]
  );

  if (!existing.rows[0]) {
    const hash = await bcrypt.hash(TEST_PASSWORD, 10);
    await executeQuery(
      `INSERT INTO users (name, email, role, password_hash, is_active)
       VALUES ($1, $2, $3, $4, true)`,
      ['Integration Test Admin', TEST_ADMIN_EMAIL, 'Admin', hash]
    );
  }

  // Ensure a low-privilege test user exists
  const existingUser = await executeQuery(
    'SELECT id FROM users WHERE email = $1',
    [TEST_USER_EMAIL]
  );

  if (!existingUser.rows[0]) {
    const hash = await bcrypt.hash(TEST_PASSWORD, 10);
    await executeQuery(
      `INSERT INTO users (name, email, role, password_hash, is_active)
       VALUES ($1, $2, $3, $4, true)`,
      ['Integration Test User', TEST_USER_EMAIL, 'Help Desk', hash]
    );
  }
}

async function setup() {
  await seed();
  console.log('[jest-setup] DB seeded for integration tests');
}

module.exports = setup;
