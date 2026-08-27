/**
 * User management integration tests
 *
 * Covers: CRUD operations, pagination, search, role changes,
 * activate/deactivate, validation, RBAC, error cases.
 */
const request = require('supertest');
const app = require('../../backend/app');
const { executeQuery } = require('../../backend/config/db');
const {
  loginAsAdmin,
  loginAsUser,
  createTestUser,
  cleanupTestUser,
  ADMIN_EMAIL,
  TEST_PASSWORD
} = require('./helpers');

const BASE = '/api/users';

describe('GET /api/users', () => {
  it('should return 401 without token', async () => {
    await request(app).get(BASE).expect(401);
  });

  it('should return paginated user list for Admin', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toHaveProperty('total');
    expect(res.body.pagination).toHaveProperty('page');
    expect(res.body.pagination).toHaveProperty('pageSize');
  });

  it('should return 403 for non-Admin role', async () => {
    const token = await loginAsUser();
    await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('should support role filter', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(`${BASE}?role=Admin`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.every(u => u.role === 'Admin')).toBe(true);
  });

  it('should support search filter', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(`${BASE}?search=integration`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should support pagination params', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(`${BASE}?page=1&pageSize=2`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.pagination.pageSize).toBe(2);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
  });

  it('should support sort by created_at ASC', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(`${BASE}?sortBy=created_at&sortDirection=ASC`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/users/search', () => {
  it('should return 401 without token', async () => {
    await request(app).get(`${BASE}/search`).expect(401);
  });

  it('should return users matching search query', async () => {
    const token = await loginAsUser();
    const res = await request(app)
      .get(`${BASE}/search?q=integration`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should return empty array for no-match query', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(`${BASE}/search?q=zzz_nonexistent_user`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual([]);
  });
});

describe('POST /api/users (create)', () => {
  it('should return 401 without token', async () => {
    await request(app).post(BASE).send({}).expect(401);
  });

  it('should return 403 for non-Admin', async () => {
    const token = await loginAsUser();
    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New User',
        email: 'new@example.com',
        role: 'IT Team',
        password: TEST_PASSWORD
      })
      .expect(403);
  });

  it('should create a user and return 201', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Integration Test Create',
        email: 'itest-create@example.com',
        phone: '9876543210',
        role: 'IT Team',
        password: TEST_PASSWORD
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.email).toBe('itest-create@example.com');
    expect(res.body.role).toBe('IT Team');
    expect(res.body.is_active).toBe(true);
    expect(res.body.password_hash).toBeUndefined();

    await cleanupTestUser(res.body.id);
  });

  it('should reject missing required fields', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'partial@example.com' })
      .expect(400);
  });

  it('should reject invalid role', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Bad Role User',
        email: 'itest-badrole@example.com',
        role: 'SuperAdmin',
        password: TEST_PASSWORD
      })
      .expect(400);
  });

  it('should reject duplicate email', async () => {
    const token = await loginAsAdmin();
    const uniqueEmail = `itest-dup-${Date.now()}@example.com`;

    // First create with unique email
    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Dup User First',
        email: uniqueEmail,
        role: 'IT Team',
        password: TEST_PASSWORD
      })
      .expect(201);

    // Second with same email should fail (PostgreSQL unique constraint → 500)
    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Dup User Second',
        email: uniqueEmail,
        role: 'IT Team',
        password: TEST_PASSWORD
      })
      .expect(500);
  });
});

describe('PATCH /api/users/:id (edit)', () => {
  let testUserId;

  beforeEach(async () => {
    const { id } = await createTestUser('Edit Test User', 'itest-edit@example.com', 'IT Team');
    testUserId = id;
  });

  afterEach(async () => {
    await cleanupTestUser(testUserId);
  });

  it('should return 401 without token', async () => {
    await request(app).patch(`${BASE}/${testUserId}`).expect(401);
  });

  it('should allow Admin to edit user name', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .patch(`${BASE}/${testUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Edited Name' })
      .expect(200);

    expect(res.body.name).toBe('Edited Name');
  });

  it('should allow partial update (only email)', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .patch(`${BASE}/${testUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'itest-edit-updated@example.com' })
      .expect(200);

    expect(res.body.email).toBe('itest-edit-updated@example.com');
  });

  it('should return 404 for non-existent user', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .patch(`${BASE}/99999`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No one' })
      .expect(404);
  });

  it('should reject empty update body', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .patch(`${BASE}/${testUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);
  });
});

describe('PATCH /api/users/:id/role', () => {
  let testUserId;

  beforeEach(async () => {
    const { id } = await createTestUser('Role Test User', 'itest-role@example.com', 'IT Team');
    testUserId = id;
  });

  afterEach(async () => {
    await cleanupTestUser(testUserId);
  });

  it('should allow Admin to change role', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .patch(`${BASE}/${testUserId}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'Network Team' })
      .expect(200);

    expect(res.body.role).toBe('Network Team');
  });

  it('should reject invalid role change', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .patch(`${BASE}/${testUserId}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'SuperUser' })
      .expect(400);
  });

  it('should return 404 for non-existent user', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .patch(`${BASE}/99999/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'Admin' })
      .expect(404);
  });
});

describe('PATCH /api/users/:id/password', () => {
  let testUserId;

  beforeEach(async () => {
    const { id } = await createTestUser('Pass Test User', 'itest-pass@example.com', 'IT Team');
    testUserId = id;
  });

  afterEach(async () => {
    await cleanupTestUser(testUserId);
  });

  it('should allow Admin to update password', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .patch(`${BASE}/${testUserId}/password`)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'NewPass@123' })
      .expect(200);

    expect(res.body.message).toBe('Password updated');
  });

  it('should reject short password', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .patch(`${BASE}/${testUserId}/password`)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'short' })
      .expect(400);
  });

  it('should return 404 for non-existent user', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .patch(`${BASE}/99999/password`)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'NewPass@123' })
      .expect(404);
  });
});

describe('PATCH /api/users/:id/activate & /deactivate', () => {
  let testUserId;

  beforeEach(async () => {
    const { id } = await createTestUser('Activate Test', 'itest-activate@example.com', 'IT Team');
    testUserId = id;
  });

  afterEach(async () => {
    await executeQuery('UPDATE users SET is_active = true WHERE id = $1', [testUserId]);
    await cleanupTestUser(testUserId);
  });

  it('should deactivate a user', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .patch(`${BASE}/${testUserId}/deactivate`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.is_active).toBe(false);
  });

  it('should reactivate a deactivated user', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .patch(`${BASE}/${testUserId}/deactivate`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const res = await request(app)
      .patch(`${BASE}/${testUserId}/activate`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.is_active).toBe(true);
  });

  it('should return 404 for non-existent user deactivate', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .patch('/api/users/99999/deactivate')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});

describe('Data isolation', () => {
  it('should not allow Help Desk to edit users', async () => {
    const token = await loginAsUser();
    const { id } = await createTestUser('Isolation Test', 'itest-iso@example.com', 'Admin');
    try {
      await request(app)
        .patch(`${BASE}/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Hacked' })
        .expect(403);
    } finally {
      await cleanupTestUser(id);
    }
  });
});
