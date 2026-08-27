/**
 * Authentication integration tests
 *
 * Covers: login success/failure, JWT validation, RBAC enforcement,
 * inactive user handling, token expiration, missing fields.
 */
const request = require('supertest');
const app = require('../../backend/app');
const { executeQuery } = require('../../backend/config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  loginAsAdmin,
  createTestUser,
  cleanupTestUser,
  ADMIN_EMAIL,
  TEST_PASSWORD,
  JWT_SECRET
} = require('./helpers');

const BASE = '/api/auth';

describe('POST /api/auth/login', () => {
  it('should return 200 with token for valid admin credentials', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: ADMIN_EMAIL, password: TEST_PASSWORD })
      .expect(200);

    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toMatchObject({
      email: ADMIN_EMAIL,
      role: 'Admin'
    });
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(20);
  });

  it('should return 401 for wrong password', async () => {
    await request(app)
      .post(`${BASE}/login`)
      .send({ email: ADMIN_EMAIL, password: 'wrongpassword123' })
      .expect(401)
      .then(res => {
        expect(res.body.error).toBe('Invalid credentials');
      });
  });

  it('should return 401 for non-existent email', async () => {
    await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'nouser@example.com', password: TEST_PASSWORD })
      .expect(401);
  });

  it('should return 400 for missing email', async () => {
    await request(app)
      .post(`${BASE}/login`)
      .send({ password: TEST_PASSWORD })
      .expect(400);
  });

  it('should return 400 for missing password', async () => {
    await request(app)
      .post(`${BASE}/login`)
      .send({ email: ADMIN_EMAIL })
      .expect(400);
  });

  it('should return 400 for invalid email format', async () => {
    await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'notanemail', password: TEST_PASSWORD })
      .expect(400);
  });

  it('should return 403 for inactive user', async () => {
    const { id } = await createTestUser(
      'Temp Inactive User',
      'itest-inactive@example.com',
      'IT Team'
    );
    try {
      await executeQuery('UPDATE users SET is_active = false WHERE id = $1', [id]);
      await request(app)
        .post(`${BASE}/login`)
        .send({ email: 'itest-inactive@example.com', password: TEST_PASSWORD })
        .expect(403)
        .then(res => {
          expect(res.body.error).toBe('User is inactive');
        });
    } finally {
      await executeQuery('UPDATE users SET is_active = true WHERE id = $1', [id]);
      await cleanupTestUser(id);
    }
  });

  it('should accept correct credentials for Help Desk user', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'itest-user@example.com', password: TEST_PASSWORD })
      .expect(200);

    expect(res.body.user.role).toBe('Help Desk');
    expect(res.body.token).toBeTruthy();
  });
});

describe('JWT token validation on protected routes', () => {
  it('should return 401 for missing Authorization header', async () => {
    await request(app)
      .get('/api/users')
      .expect(401);
  });

  it('should return 401 for malformed Authorization header', async () => {
    await request(app)
      .get('/api/users')
      .set('Authorization', 'BadScheme abc123')
      .expect(401);
  });

  it('should return 401 for invalid token', async () => {
    await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(401);
  });

  it('should return 401 for expired token', async () => {
    const expiredToken = jwt.sign(
      { id: 1, email: 'expired@example.com', role: 'Admin' },
      JWT_SECRET,
      { expiresIn: '-1h' }
    );
    await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('should reject token signed with wrong secret', async () => {
    const badToken = jwt.sign(
      { id: 1, email: 'admin@example.com', role: 'Admin' },
      'wrong-secret',
      { expiresIn: '8h' }
    );
    await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${badToken}`)
      .expect(401);
  });
});

describe('RBAC enforcement on protected endpoints', () => {
  let userToken;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'itest-user@example.com', password: TEST_PASSWORD });
    userToken = res.body.token;
  });

  it('should allow Admin to list users', async () => {
    const adminToken = await loginAsAdmin();
    await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('should deny Help Desk user from listing users', async () => {
    await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('should allow Admin to create user', async () => {
    const adminToken = await loginAsAdmin();
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'RBAC Test User',
        email: 'itest-rbac@example.com',
        role: 'IT Team',
        password: TEST_PASSWORD
      })
      .expect(201);

    expect(res.body.email).toBe('itest-rbac@example.com');
    await cleanupTestUser(res.body.id);
  });

  it('should deny Help Desk user from creating user', async () => {
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Unauthorized User',
        email: 'unauth@example.com',
        role: 'IT Team',
        password: TEST_PASSWORD
      })
      .expect(403);
  });

  it('should allow Help Desk to view inventory', async () => {
    await request(app)
      .get('/api/inventory')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
  });

  it('should allow Help Desk to create ticket', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'IT-TEST-RBAC ticket',
        description: 'Test for RBAC enforcement'
      })
      .expect(201);

    expect(res.body.title).toBe('IT-TEST-RBAC ticket');
    await request(app)
      .delete(`/api/tickets/${res.body.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
  });

  it('should deny Help Desk from accessing settings', async () => {
    await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('should allow Admin to access settings', async () => {
    const adminToken = await loginAsAdmin();
    await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('should allow all roles to view dashboard', async () => {
    const adminToken = await loginAsAdmin();
    await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
  });
});

describe('Password validation', () => {
  it('should reject password shorter than 8 chars on user creation', async () => {
    const adminToken = await loginAsAdmin();
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Short Pass User',
        email: 'itest-short@example.com',
        role: 'IT Team',
        password: 'short'
      })
      .expect(400);
  });

  it('should reject user creation with duplicate email', async () => {
    const adminToken = await loginAsAdmin();
    const uniqueEmail = `itest-auth-dup-${Date.now()}@example.com`;

    // First create with unique email
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dup User First',
        email: uniqueEmail,
        role: 'IT Team',
        password: TEST_PASSWORD
      })
      .expect(201);

    // Second with same email should fail (PostgreSQL unique constraint → 500)
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dup User Second',
        email: uniqueEmail,
        role: 'IT Team',
        password: TEST_PASSWORD
      })
      .expect(500);
  });
});
