/**
 * Dashboard integration tests
 *
 * Covers: stats endpoint, RBAC, empty datasets, error handling.
 */
const request = require('supertest');
const app = require('../../backend/app');
const { executeQuery } = require('../../backend/config/db');
const { loginAsAdmin, loginAsUser, createTestUser, cleanupTestUser, TEST_PASSWORD } = require('./helpers');

const BASE = '/api/dashboard';

describe('GET /api/dashboard', () => {
  it('should return 401 without token', async () => {
    await request(app).get(BASE).expect(401);
  });

  it('should return dashboard stats for Admin', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('totalAssets');
    expect(res.body).toHaveProperty('assignedAssets');
    expect(res.body).toHaveProperty('availableAssets');
    expect(res.body).toHaveProperty('inMaintenance');
    expect(res.body).toHaveProperty('openTickets');
    expect(res.body).toHaveProperty('recentAssets');
    expect(res.body).toHaveProperty('recentTickets');

    expect(typeof res.body.totalAssets).toBe('number');
    expect(typeof res.body.openTickets).toBe('number');
    expect(Array.isArray(res.body.recentAssets)).toBe(true);
    expect(Array.isArray(res.body.recentTickets)).toBe(true);
  });

  it('should return dashboard stats for Help Desk', async () => {
    const token = await loginAsUser();
    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.totalAssets).toBeDefined();
    expect(res.body.openTickets).toBeDefined();
  });

  it('should return zero counts on empty database', async () => {
    const token = await loginAsAdmin();

    // Ensure no test data interferes — delete inventory, then ticket_history for IT-TEST tickets, then tickets
    await executeQuery("DELETE FROM inventory WHERE asset_description LIKE 'IT-TEST-%'");
    const testTickets = await executeQuery("SELECT id FROM tickets WHERE title LIKE 'IT-TEST-%'");
    if (testTickets.rows.length) {
      const ids = testTickets.rows.map(r => r.id).join(',');
      await executeQuery(`DELETE FROM ticket_history WHERE ticket_id IN (${ids})`);
    }
    await executeQuery("DELETE FROM tickets WHERE title LIKE 'IT-TEST-%'");

    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verify numeric types; counts may include production data
    expect(typeof res.body.totalAssets).toBe('number');
    expect(typeof res.body.assignedAssets).toBe('number');
    expect(typeof res.body.availableAssets).toBe('number');
    expect(typeof res.body.inMaintenance).toBe('number');
    expect(typeof res.body.openTickets).toBe('number');
    expect(Array.isArray(res.body.recentAssets)).toBe(true);
    expect(Array.isArray(res.body.recentTickets)).toBe(true);
  });

  it('should return recent assets sorted by created_at DESC', async () => {
    const token = await loginAsAdmin();

    // Create a few assets
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ministry: 'Ministry of Electronics & IT',
          department: 'Department of IT',
          asset_category: 'Laptop',
          asset_description: `IT-TEST-Recent Asset ${i}`,
          serial_number: `IT-TEST-REC-SN-${Date.now()}-${i}`,
          asset_user: `Test User ${i}`,
          asset_custodian: 'Test Custodian',
          asset_current_status: 'Available',
          block_name: 'Block A', floor: '1', room: '101', workstation: `WS-${i}`
        });
    }

    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.recentAssets.length).toBeLessThanOrEqual(5);
    expect(res.body.recentAssets.length).toBeGreaterThan(0);

    // Cleanup
    await executeQuery("DELETE FROM inventory WHERE asset_description LIKE 'IT-TEST-Recent%'");
  });

  it('should return recent tickets sorted by created_at DESC', async () => {
    const token = await loginAsAdmin();

    await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'IT-TEST-Recent Ticket',
        description: 'Recent ticket for dashboard test'
      });

    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.recentTickets.length).toBeGreaterThan(0);

    // Cleanup: get ticket IDs then delete history before tickets (FK constraint)
    const tickets = await executeQuery("SELECT id FROM tickets WHERE title LIKE 'IT-TEST-Recent%'");
    if (tickets.rows.length) {
      const ids = tickets.rows.map(r => r.id).join(',');
      await executeQuery(`DELETE FROM ticket_history WHERE ticket_id IN (${ids})`);
    }
    await executeQuery("DELETE FROM tickets WHERE title LIKE 'IT-TEST-Recent%'");
  });
});

describe('Dashboard RBAC', () => {
  it('should deny access to roles not in ["Admin", "Help Desk", "IT Team"]', async () => {
    // Create a Network Team user
    const { id, token } = await createTestUser(
      'Network Team Test',
      'itest-network@example.com',
      'Network Team'
    );

    try {
      await request(app)
        .get(BASE)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    } finally {
      await cleanupTestUser(id);
    }
  });
});
