/**
 * Reports integration tests
 *
 * Covers: aggregation queries, RBAC, empty datasets, data correctness.
 */
const request = require('supertest');
const app = require('../../backend/app');
const { executeQuery } = require('../../backend/config/db');
const { loginAsAdmin, loginAsUser, createTestUser, cleanupTestUser, TEST_PASSWORD } = require('./helpers');

const BASE = '/api/reports';

describe('GET /api/reports', () => {
  it('should return 401 without token', async () => {
    await request(app).get(BASE).expect(401);
  });

  it('should return reports data for Admin', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('assetsByStatus');
    expect(res.body).toHaveProperty('assetsByMinistry');
    expect(res.body).toHaveProperty('ticketsByTeam');
    expect(res.body).toHaveProperty('ticketsByStatus');
    expect(res.body).toHaveProperty('ticketTrend');
    expect(res.body).toHaveProperty('totals');
    expect(res.body).toHaveProperty('usersByRole');

    expect(Array.isArray(res.body.assetsByStatus)).toBe(true);
    expect(Array.isArray(res.body.assetsByMinistry)).toBe(true);
    expect(Array.isArray(res.body.ticketsByTeam)).toBe(true);
    expect(Array.isArray(res.body.ticketsByStatus)).toBe(true);
    expect(Array.isArray(res.body.ticketTrend)).toBe(true);
    expect(Array.isArray(res.body.usersByRole)).toBe(true);

    expect(res.body.totals).toHaveProperty('totalAssets');
    expect(res.body.totals).toHaveProperty('totalTickets');
    expect(res.body.totals).toHaveProperty('openTickets');
    expect(res.body.totals).toHaveProperty('resolvedTickets');
  });

  it('should return reports for Help Desk', async () => {
    const token = await loginAsUser();
    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.totals.totalAssets).toBeDefined();
    expect(res.body.totals.totalTickets).toBeDefined();
  });

  it('should return empty arrays on clean database', async () => {
    const token = await loginAsAdmin();

    // Clean test data — delete inventory, then ticket_history for IT-TEST tickets, then tickets
    await executeQuery("DELETE FROM inventory WHERE asset_description LIKE 'IT-TEST-%'");
    const rTickets = await executeQuery("SELECT id FROM tickets WHERE title LIKE 'IT-TEST-%'");
    if (rTickets.rows.length) {
      const ids = rTickets.rows.map(r => r.id).join(',');
      await executeQuery(`DELETE FROM ticket_history WHERE ticket_id IN (${ids})`);
    }
    await executeQuery("DELETE FROM tickets WHERE title LIKE 'IT-TEST-%'");

    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.assetsByStatus).toEqual([]);
    expect(res.body.assetsByMinistry).toEqual([]);
    expect(res.body.ticketsByTeam).toEqual([]);
    expect(res.body.ticketsByStatus).toEqual([]);
    expect(res.body.ticketTrend).toEqual([]);
    // totalAssets/totalTickets may have production data; verify structure only
    expect(typeof res.body.totals.totalAssets).toBe('number');
    expect(typeof res.body.totals.totalTickets).toBe('number');
  });

  it('should aggregate assets by status correctly', async () => {
    const token = await loginAsAdmin();

    // Create assets with different statuses
    for (const [status, count] of [['Available', 2], ['Assigned', 1], ['In Maintenance', 1]]) {
      for (let i = 0; i < count; i++) {
        await request(app)
          .post('/api/inventory')
          .set('Authorization', `Bearer ${token}`)
          .send({
            ministry: 'Ministry of Electronics & IT',
            department: 'Department of IT',
            asset_category: 'Laptop',
            asset_description: `IT-TEST-Status Report ${status}-${i}`,
            serial_number: `IT-TEST-STAT-SN-${Date.now()}-${status}-${i}`,
            asset_user: `Status User ${i}`,
            asset_custodian: 'Test Custodian',
            asset_current_status: status,
            block_name: 'Block A', floor: '1', room: '101', workstation: `WS-${i}`
          });
      }
    }

    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const statusMap = {};
    for (const item of res.body.assetsByStatus) {
      statusMap[item.label] = parseInt(item.count, 10);
    }

    expect(statusMap['Available']).toBe(2);
    expect(statusMap['Assigned']).toBe(1);
    expect(statusMap['In Maintenance']).toBe(1);

    // Cleanup
    await executeQuery("DELETE FROM inventory WHERE asset_description LIKE 'IT-TEST-Status%'");
  });

  it('should aggregate tickets by team correctly', async () => {
    const token = await loginAsAdmin();

    await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'IT-TEST-Ticket Team A', description: 'Team A ticket' });

    await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'IT-TEST-Ticket Team B', description: 'Team B ticket' });

    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const teamMap = {};
    for (const item of res.body.ticketsByTeam) {
      teamMap[item.label] = parseInt(item.count, 10);
    }

    // Verify the two test tickets are counted (may include production data)
    expect(teamMap['IT Help Desk']).toBeGreaterThanOrEqual(2);

    // Cleanup: get ticket IDs then delete history before tickets (FK constraint)
    const tix = await executeQuery("SELECT id FROM tickets WHERE title LIKE 'IT-TEST-Ticket%'");
    if (tix.rows.length) {
      const ids = tix.rows.map(r => r.id).join(',');
      await executeQuery(`DELETE FROM ticket_history WHERE ticket_id IN (${ids})`);
    }
    await executeQuery("DELETE FROM tickets WHERE title LIKE 'IT-TEST-Ticket%'");
  });

  it('should include ticket trend for last 30 days', async () => {
    const token = await loginAsAdmin();

    // Create tickets with different dates
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const date = new Date(now.getTime() - i * 86400000);
      await executeQuery(
        `INSERT INTO tickets (title, description, status, created_by, assigned_team, created_at)
         VALUES ($1, $2, 'Open', 1, 'IT Help Desk', $3)`,
        [`IT-TEST-Trend ${i}`, 'Trend test', date.toISOString()]
      );
      await executeQuery(
        `INSERT INTO ticket_history (ticket_id, action, from_team, to_team, note, performed_by)
         VALUES (currval('tickets_id_seq'), 'Created', NULL, 'IT Help Desk', 'IT-TEST-%', 1)`,
        []
      );
    }

    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.ticketTrend)).toBe(true);
    expect(res.body.ticketTrend.length).toBeGreaterThan(0);

    // Cleanup: get ticket IDs then delete history before tickets (FK constraint)
    const trendTickets = await executeQuery("SELECT id FROM tickets WHERE title LIKE 'IT-TEST-Trend%'");
    if (trendTickets.rows.length) {
      const ids = trendTickets.rows.map(r => r.id).join(',');
      await executeQuery(`DELETE FROM ticket_history WHERE ticket_id IN (${ids})`);
    }
    await executeQuery("DELETE FROM tickets WHERE title LIKE 'IT-TEST-Trend%'");
  });
});

describe('Reports RBAC', () => {
  it('should deny access to Cybersecurity role', async () => {
    const { id, token } = await createTestUser(
      'Cyber Test',
      'itest-cyber@example.com',
      'Cybersecurity'
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
