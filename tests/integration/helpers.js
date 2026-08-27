/**
 * Shared test helpers for the integration test suite.
 *
 * - loginAsAdmin()  → returns a Bearer token for the test admin
 * - loginAsUser()   → returns a Bearer token for the test Help Desk user
 * - request(app, method, path, body, token?) → supertest-style helper
 * - cleanupTestUser(id) → deletes a test user and any related data
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../../backend/config/db');

const ADMIN_EMAIL = 'itest-admin@example.com';
const USER_EMAIL = 'itest-user@example.com';
const TEST_PASSWORD = 'TestPass@123';
const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-integration-tests';

/**
 * Create a fresh test admin token by logging in (or sign directly for speed).
 */
async function loginAsAdmin() {
  const result = await executeQuery(
    'SELECT id, name, email, role FROM users WHERE email = $1 AND is_active = true',
    [ADMIN_EMAIL]
  );
  if (!result.rows[0]) throw new Error('Test admin user not found');
  const user = result.rows[0];
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
  return token;
}

/**
 * Create a fresh test user (Help Desk) token.
 */
async function loginAsUser() {
  const result = await executeQuery(
    'SELECT id, name, email, role FROM users WHERE email = $1 AND is_active = true',
    [USER_EMAIL]
  );
  if (!result.rows[0]) throw new Error('Test user not found');
  const user = result.rows[0];
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
  return token;
}

/**
 * Create a one-off test user and return { id, token, email }.
 */
async function createTestUser(name, email, role = 'IT Team', password = TEST_PASSWORD) {
  const hash = await bcrypt.hash(password, 10);
  const result = await executeQuery(
    `INSERT INTO users (name, email, role, password_hash, is_active)
     VALUES ($1, $2, $3, $4, true) RETURNING id`,
    [name, email, role, hash]
  );
  const id = result.rows[0].id;
  const token = jwt.sign(
    { id, email, role, name },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
  return { id, token, email };
}

/**
 * Clean up a test user (soft: mark inactive, then hard delete).
 */
async function cleanupTestUser(id) {
  await executeQuery('DELETE FROM users WHERE id = $1', [id]);
}

/**
 * Clean up test inventory records created during tests.
 */
async function cleanupTestAssets() {
  await executeQuery("DELETE FROM inventory WHERE asset_description LIKE 'IT-TEST-%'");
}

/**
 * Clean up test tickets created during tests.
 */
async function cleanupTestTickets() {
  await executeQuery("DELETE FROM ticket_history WHERE note LIKE 'IT-TEST-%' OR note LIKE 'Created for integration test%'");
  await executeQuery("DELETE FROM tickets WHERE title LIKE 'IT-TEST-%'");
}

module.exports = {
  loginAsAdmin,
  loginAsUser,
  createTestUser,
  cleanupTestUser,
  cleanupTestAssets,
  cleanupTestTickets,
  ADMIN_EMAIL,
  TEST_PASSWORD,
  JWT_SECRET
};
