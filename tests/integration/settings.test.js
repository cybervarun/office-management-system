/**
 * Settings integration tests
 *
 * Covers: GET settings, update notifications, RBAC, error handling.
 */
const request = require('supertest');
const app = require('../../backend/app');
const { loginAsAdmin, loginAsUser, createTestUser, cleanupTestUser, TEST_PASSWORD } = require('./helpers');

const BASE = '/api/settings';

describe('GET /api/settings', () => {
  it('should return 401 without token', async () => {
    await request(app).get(BASE).expect(401);
  });

  it('should return 403 for non-Admin', async () => {
    const token = await loginAsUser();
    await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('should return settings for Admin', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('roles');
    expect(res.body).toHaveProperty('teams');
    expect(res.body).toHaveProperty('roleStats');
    expect(res.body).toHaveProperty('notifications');
    expect(res.body).toHaveProperty('systemInfo');

    expect(Array.isArray(res.body.roles)).toBe(true);
    expect(res.body.roles.length).toBeGreaterThan(0);
    expect(Array.isArray(res.body.teams)).toBe(true);
    expect(res.body.teams.length).toBeGreaterThan(0);
    expect(Array.isArray(res.body.roleStats)).toBe(true);
    expect(res.body.notifications).toHaveProperty('emailAlerts');
    expect(res.body.notifications).toHaveProperty('ticketAssignments');
    expect(res.body.systemInfo).toHaveProperty('version');
    expect(res.body.systemInfo).toHaveProperty('environment');
  });

  it('should list valid roles in settings', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const expectedRoles = ['Admin', 'Help Desk', 'IT Team', 'Network Team', 'Cybersecurity'];
    expect(res.body.roles).toEqual(expectedRoles);
  });

  it('should list valid teams in settings', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const expectedTeams = ['IT Help Desk', 'IT Team', 'Network Team', 'Cybersecurity Team'];
    expect(res.body.teams).toEqual(expectedTeams);
  });
});

describe('PATCH /api/settings/notifications', () => {
  it('should return 401 without token', async () => {
    await request(app).patch(`${BASE}/notifications`).send({}).expect(401);
  });

  it('should return 403 for non-Admin', async () => {
    const token = await loginAsUser();
    await request(app)
      .patch(`${BASE}/notifications`)
      .set('Authorization', `Bearer ${token}`)
      .send({ emailAlerts: false })
      .expect(403);
  });

  it('should update notification settings', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .patch(`${BASE}/notifications`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        emailAlerts: false,
        ticketAssignments: true,
        securityAlerts: false
      })
      .expect(200);

    expect(res.body.message).toBe('Settings updated');
    expect(res.body.emailAlerts).toBe(false);
    expect(res.body.ticketAssignments).toBe(true);
    expect(res.body.securityAlerts).toBe(false);
  });

  it('should ignore unknown notification keys', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .patch(`${BASE}/notifications`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        emailAlerts: true,
        unknownKey: 'should be ignored'
      })
      .expect(200);

    expect(res.body.unknownKey).toBeUndefined();
    expect(res.body.emailAlerts).toBe(true);
  });

  it('should coerce non-boolean values to boolean', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .patch(`${BASE}/notifications`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        emailAlerts: 'yes',
        ticketAssignments: 1
      })
      .expect(200);

    expect(res.body.emailAlerts).toBe(true);
    expect(res.body.ticketAssignments).toBe(true);
  });
});

describe('Settings RBAC isolation', () => {
  it('should not leak settings data to non-Admin roles', async () => {
    const roles = ['Help Desk', 'IT Team', 'Network Team', 'Cybersecurity'];

    for (const role of roles) {
      const { id, token } = await createTestUser(
        `${role} Settings Test`,
        `itest-settings-${role.toLowerCase().replace(' ', '-')}@example.com`,
        role
      );

      try {
        await request(app)
          .get(BASE)
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      } finally {
        await cleanupTestUser(id);
      }
    }
  });
});
