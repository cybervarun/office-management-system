/**
 * Per-file setup — before each spec file.
 * Seeds the DB and creates a fresh admin token.
 */
const { loginAsAdmin, loginAsUser } = require('./helpers');

let adminToken = null;
let userToken = null;

beforeAll(async () => {
  adminToken = await loginAsAdmin();
  userToken = await loginAsUser();
});

beforeEach(async () => {
  // Reset tokens before each test in case they expire
  adminToken = await loginAsAdmin();
  userToken = await loginAsUser();
});

/** Attach auth header to a supertest request */
function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

function bearer(token) {
  return `Bearer ${token}`;
}

module.exports = { auth, bearer, adminToken, userToken };
