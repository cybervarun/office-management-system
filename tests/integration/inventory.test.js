/**
 * Inventory integration tests
 *
 * Covers: CRUD operations, search, dropdowns, duplicate detection,
 * validation, RBAC, error cases.
 */
const request = require('supertest');
const app = require('../../backend/app');
const { executeQuery } = require('../../backend/config/db');
const {
  loginAsAdmin,
  loginAsUser,
  cleanupTestAssets,
  cleanupTestTickets
} = require('./helpers');

const BASE = '/api/inventory';

let _assetCounter = 0;
function makeAsset(overrides = {}) {
  _assetCounter++;
  const ts = Date.now() + _assetCounter;
  return {
    ministry: 'Ministry of Electronics & IT',
    department: 'Department of IT',
    asset_category: 'Laptop',
    asset_description: `IT-TEST-Integration Test Laptop ${ts}`,
    serial_number: `IT-TEST-SN-${ts}`,
    mac_address: `AA:BB:CC:DD:EE:${(ts % 256).toString(16).padStart(2, '0').toUpperCase()}`,
    asset_user: 'Test User',
    asset_custodian: 'Test Custodian',
    asset_current_status: 'Available',
    block_name: 'Block A',
    floor: '1',
    room: '101',
    workstation: `WS-${ts}`,
    ...overrides
  };
}

const VALID_ASSET = makeAsset();

describe('GET /api/inventory', () => {
  it('should return 401 without token', async () => {
    await request(app).get(BASE).expect(401);
  });

  it('should return paginated inventory list for Help Desk', async () => {
    const token = await loginAsUser();
    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('pagination');
  });

  it('should support search filter', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(`${BASE}?search=IT-TEST`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.every(a =>
      a.asset_user?.includes('IT-TEST') ||
      a.email?.includes('IT-TEST') ||
      a.phone?.includes('IT-TEST') ||
      a.asset_description?.includes('IT-TEST')
    )).toBe(true);
  });

  it('should support ministry filter', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(`${BASE}?ministry=Ministry of Electronics & IT`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should support asset_category filter', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(`${BASE}?asset_category=Laptop`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/inventory/:id', () => {
  let assetId;

  beforeEach(async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(makeAsset());
    assetId = res.body.id;
  });

  afterEach(async () => {
    if (assetId) {
      await request(app)
        .delete(`${BASE}/${assetId}`)
        .set('Authorization', `Bearer ${await loginAsAdmin()}`);
      assetId = null;
    }
  });

  it('should return 401 without token', async () => {
    await request(app).get(`${BASE}/1`).expect(401);
  });

  it('should return asset by ID', async () => {
    const token = await loginAsUser();
    const res = await request(app)
      .get(`${BASE}/${assetId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.id).toBe(assetId);
  });

  it('should return 404 for non-existent asset', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .get(`${BASE}/99999`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});

describe('POST /api/inventory (create)', () => {
  it('should return 401 without token', async () => {
    await request(app).post(BASE).send({}).expect(401);
  });

  it('should create an asset and return 201', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...VALID_ASSET,
        serial_number: `IT-TEST-SN-${Date.now()}`
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.asset_id).toBeDefined();
    expect(res.body.asset_description).toBe(VALID_ASSET.asset_description);
    expect(res.body.password_hash).toBeUndefined();
  });

  it('should return 200 for duplicate serial_number', async () => {
    const token = await loginAsAdmin();
    const dupSerial = `IT-TEST-DUP-SN-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Clean up any leftover asset with this serial from prior runs
    await executeQuery('DELETE FROM inventory WHERE serial_number = $1', [dupSerial]);

    // First insert — should create new (201) or return existing (200)
    const createRes = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...VALID_ASSET, serial_number: dupSerial });

    const existingId = createRes.body.id;
    expect([200, 201]).toContain(createRes.status);

    // Second insert with same serial should return existing (200)
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...VALID_ASSET, serial_number: dupSerial })
      .expect(200);

    expect(res.body.message).toBe('Asset already exists');
    expect(res.body.asset).toBeDefined();

    // Cleanup only if we actually created it
    if (createRes.status === 201) {
      await request(app).delete(`${BASE}/${existingId}`).set('Authorization', `Bearer ${token}`);
    }
  });

  it('should require either serial_number or mac_address', async () => {
    const token = await loginAsAdmin();
    const payload = { ...VALID_ASSET };
    delete payload.serial_number;
    delete payload.mac_address;

    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(400);
  });

  it('should require mandatory fields (ministry, department, etc.)', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ asset_description: 'Missing fields' })
      .expect(400);
  });

  it('should reject invalid MAC address', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...VALID_ASSET,
        mac_address: 'invalid-mac',
        serial_number: `IT-TEST-MAC-FAIL-${Date.now()}`
      })
      .expect(400);
  });

  it('should reject invalid IP address', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...VALID_ASSET,
        ip_address: 'not-an-ip',
        serial_number: `IT-TEST-IP-FAIL-${Date.now()}`
      })
      .expect(400);
  });

  it('should deny Network Team from creating assets', async () => {
    const { id, token } = await require('./helpers').createTestUser(
      'Network Team Test', 'itest-net-create@example.com', 'Network Team'
    );
    try {
      await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${token}`)
        .send(VALID_ASSET)
        .expect(403);
    } finally {
      await require('./helpers').cleanupTestUser(id);
    }
  });
});

describe('PUT /api/inventory/:id (edit)', () => {
  let assetId;

  beforeEach(async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(makeAsset());
    assetId = res.body.id;
  });

  afterEach(async () => {
    if (assetId) {
      await request(app)
        .delete(`${BASE}/${assetId}`)
        .set('Authorization', `Bearer ${await loginAsAdmin()}`);
      assetId = null;
    }
  });

  it('should return 401 without token', async () => {
    await request(app).put(`${BASE}/${assetId}`).expect(401);
  });

  it('should update asset fields', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .put(`${BASE}/${assetId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        asset_description: 'IT-TEST-Updated Laptop',
        asset_current_status: 'Assigned'
      })
      .expect(200);

    expect(res.body.asset_description).toBe('IT-TEST-Updated Laptop');
    expect(res.body.asset_current_status).toBe('Assigned');
  });

  it('should return 404 for non-existent asset', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .put(`${BASE}/99999`)
      .set('Authorization', `Bearer ${token}`)
      .send({ asset_description: 'Ghost' })
      .expect(404);
  });

  it('should reject changing asset_id', async () => {
    const token = await loginAsAdmin();
    // Sending only asset_id (which gets stripped) should return 400 - no valid fields
    await request(app)
      .put(`${BASE}/${assetId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ asset_id: 'HACKED001' })
      .expect(400);
  });

  it('should deny Network Team from editing assets', async () => {
    const { id, token } = await require('./helpers').createTestUser(
      'Network Team Test', 'itest-net-edit@example.com', 'Network Team'
    );
    try {
      await request(app)
        .put(`${BASE}/${assetId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ asset_description: 'Hacked' })
        .expect(403);
    } finally {
      await require('./helpers').cleanupTestUser(id);
    }
  });
});

describe('DELETE /api/inventory/:id', () => {
  let assetId;

  beforeEach(async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(makeAsset());
    assetId = res.body.id;
  });

  afterEach(async () => {
    if (assetId) {
      await request(app)
        .delete(`${BASE}/${assetId}`)
        .set('Authorization', `Bearer ${await loginAsAdmin()}`);
      assetId = null;
    }
  });

  it('should delete an asset', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .delete(`${BASE}/${assetId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.message).toBe('Asset deleted');
    expect(res.body.asset.id).toBe(assetId);
  });

  it('should return 404 for non-existent asset', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .delete(`${BASE}/99999`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('should deny Network Team from deleting assets', async () => {
    const { id, token } = await require('./helpers').createTestUser(
      'Network Team Test', 'itest-net-del@example.com', 'Network Team'
    );
    try {
      await request(app)
        .delete(`${BASE}/${assetId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    } finally {
      await require('./helpers').cleanupTestUser(id);
    }
  });
});

describe('GET /api/inventory/dropdowns', () => {
  it('should return dropdown values for all roles', async () => {
    const token = await loginAsUser();
    const res = await request(app)
      .get(`${BASE}/dropdowns`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(typeof res.body).toBe('object');
    expect(Object.keys(res.body).length).toBeGreaterThan(0);
  });

  it('should return 401 without token', async () => {
    await request(app).get(`${BASE}/dropdowns`).expect(401);
  });
});

describe('POST /api/inventory/dropdowns (add value)', () => {
  it('should add a new dropdown value', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .post(`${BASE}/dropdowns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ field: 'ministry', value: 'IT-TEST-New Ministry' })
      .expect(200);

    expect(res.body.value).toBe('IT-TEST-New Ministry');
  });

  it('should return existing value if already present', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .post(`${BASE}/dropdowns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ field: 'ministry', value: 'IT-TEST-New Ministry' })
      .expect(200);

    const res = await request(app)
      .post(`${BASE}/dropdowns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ field: 'ministry', value: 'IT-TEST-New Ministry' })
      .expect(200);

    expect(res.body.value).toBe('IT-TEST-New Ministry');
  });

  it('should reject unsupported field', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .post(`${BASE}/dropdowns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ field: 'invalid_field', value: 'test' })
      .expect(400);
  });

  it('should reject missing field or value', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .post(`${BASE}/dropdowns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ field: 'ministry' })
      .expect(400);
  });
});

describe('GET /api/inventory/search-user', () => {
  it('should search inventory by user name/email/phone', async () => {
    const token = await loginAsUser();
    const res = await request(app)
      .get(`${BASE}/search-user?q=test`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should return empty array for no match', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(`${BASE}/search-user?q=zzz_nonexistent`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual([]);
  });
});

describe('Duplicate serial/mac detection', () => {
  it('should prevent duplicate serial_number on update', async () => {
    const token = await loginAsAdmin();
    const dupTs = Date.now();

    // Create two assets with unique serials
    const r1 = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...makeAsset(), serial_number: `IT-TEST-DUP-SN-A-${dupTs}`, asset_user: 'Dup Test A' });

    const r2 = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...makeAsset(), serial_number: `IT-TEST-DUP-SN-B-${dupTs}`, asset_user: 'Dup Test B' });

    // Try to update B with A's serial
    await request(app)
      .put(`${BASE}/${r2.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ serial_number: `IT-TEST-DUP-SN-A-${dupTs}` })
      .expect(409);

    // Cleanup
    await request(app).delete(`${BASE}/${r1.body.id}`).set('Authorization', `Bearer ${token}`);
    await request(app).delete(`${BASE}/${r2.body.id}`).set('Authorization', `Bearer ${token}`);
  });
});
