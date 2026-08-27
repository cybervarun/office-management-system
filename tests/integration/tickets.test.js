/**
 * Ticketing integration tests
 *
 * Covers: CRUD, status transitions, team assignment, transfers,
 * work notes, history tracking, RBAC, error cases.
 */
const request = require('supertest');
const app = require('../../backend/app');
const { executeQuery } = require('../../backend/config/db');
const {
  loginAsAdmin,
  loginAsUser,
  createTestUser,
  cleanupTestUser,
  cleanupTestTickets,
  TEST_PASSWORD
} = require('./helpers');

const BASE = '/api/tickets';

const VALID_TICKET = {
  title: 'IT-TEST-Integration Test Ticket',
  description: 'Description for integration testing ticket operations'
};

describe('GET /api/tickets', () => {
  it('should return 401 without token', async () => {
    await request(app).get(BASE).expect(401);
  });

  it('should return paginated ticket list', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('pagination');
  });

  it('should support status filter', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(`${BASE}?status=Open`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should support assigned_team filter', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(`${BASE}?assigned_team=IT%20Help%20Desk`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should support search filter', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(`${BASE}?search=IT-TEST`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/tickets/:id', () => {
  let ticketId;

  beforeEach(async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_TICKET);
    ticketId = res.body.id;
  });

  afterEach(async () => {
    if (ticketId) {
      await request(app)
        .delete(`${BASE}/${ticketId}`)
        .set('Authorization', `Bearer ${await loginAsAdmin()}`);
      ticketId = null;
    }
  });

  it('should return ticket with history', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(`${BASE}/${ticketId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.id).toBe(ticketId);
    expect(res.body.title).toBe(VALID_TICKET.title);
    expect(Array.isArray(res.body.history)).toBe(true);
    expect(res.body.history.length).toBeGreaterThan(0);
  });

  it('should return 404 for non-existent ticket', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .get(`${BASE}/99999`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});

describe('POST /api/tickets (create)', () => {
  it('should return 401 without token', async () => {
    await request(app).post(BASE).send({}).expect(401);
  });

  it('should create a ticket and return 201', async () => {
    const token = await loginAsUser();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_TICKET)
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe(VALID_TICKET.title);
    expect(res.body.status).toBe('Open');
    expect(res.body.assigned_team).toBe('IT Help Desk');
    expect(res.body.created_by).toBeDefined();
  });

  it('should reject missing title', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'No title' })
      .expect(400);
  });

  it('should reject missing description', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'No description' })
      .expect(400);
  });

  it('should record ticket history on creation', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_TICKET)
      .expect(201);

    const ticket = await request(app)
      .get(`${BASE}/${res.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    const createEntry = ticket.body.history.find(h => h.action === 'Created');
    expect(createEntry).toBeDefined();
    expect(createEntry.to_team).toBe('IT Help Desk');
  });

  it('should allow Admin and Help Desk to create tickets', async () => {
    const adminToken = await loginAsAdmin();
    const userToken = await loginAsUser();

    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...VALID_TICKET, title: 'IT-TEST-Admin Ticket' })
      .expect(201);

    await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...VALID_TICKET, title: 'IT-TEST-User Ticket' })
      .expect(201);
  });
});

describe('PATCH /api/tickets/:id/status', () => {
  let ticketId;

  beforeEach(async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_TICKET);
    ticketId = res.body.id;
  });

  afterEach(async () => {
    if (ticketId) {
      await request(app)
        .delete(`${BASE}/${ticketId}`)
        .set('Authorization', `Bearer ${await loginAsAdmin()}`);
      ticketId = null;
    }
  });

  it('should update ticket status', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .patch(`${BASE}/${ticketId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'In Progress' })
      .expect(200);

    expect(res.body.status).toBe('In Progress');
  });

  it('should transition through all valid statuses', async () => {
    const token = await loginAsAdmin();
    const transitions = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];

    for (const status of transitions) {
      const res = await request(app)
        .patch(`${BASE}/${ticketId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(status);
    }
  });

  it('should reject invalid status', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .patch(`${BASE}/${ticketId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Cancelled' })
      .expect(400);
  });

  it('should return 404 for non-existent ticket', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .patch(`${BASE}/99999/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Closed' })
      .expect(404);
  });

  it('should record status change in history', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .patch(`${BASE}/${ticketId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'In Progress' })
      .expect(200);

    const ticket = await request(app)
      .get(`${BASE}/${ticketId}`)
      .set('Authorization', `Bearer ${token}`);

    const statusEntry = ticket.body.history.find(h =>
      h.action === 'Status Updated' && h.note.includes('Open → In Progress')
    );
    expect(statusEntry).toBeDefined();
  });
});

describe('PATCH /api/tickets/:id/assign', () => {
  let ticketId;

  beforeEach(async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_TICKET);
    ticketId = res.body.id;
  });

  afterEach(async () => {
    if (ticketId) {
      await request(app)
        .delete(`${BASE}/${ticketId}`)
        .set('Authorization', `Bearer ${await loginAsAdmin()}`);
      ticketId = null;
    }
  });

  it('should assign ticket to a different team', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .patch(`${BASE}/${ticketId}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ toTeam: 'IT Team', note: 'IT-TEST-Assignment note' })
      .expect(200);

    expect(res.body.assigned_team).toBe('IT Team');
  });

  it('should record assignment in history', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .patch(`${BASE}/${ticketId}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ toTeam: 'Network Team' })
      .expect(200);

    const ticket = await request(app)
      .get(`${BASE}/${ticketId}`)
      .set('Authorization', `Bearer ${token}`);

    const assignEntry = ticket.body.history.find(h => h.action === 'Assigned');
    expect(assignEntry).toBeDefined();
    expect(assignEntry.to_team).toBe('Network Team');
  });

  it('should reject invalid team', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .patch(`${BASE}/${ticketId}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ toTeam: 'Invalid Team' })
      .expect(400);
  });

  it('should return 404 for non-existent ticket', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .patch(`${BASE}/99999/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ toTeam: 'IT Team' })
      .expect(404);
  });
});

describe('POST /api/tickets/transfer', () => {
  let ticketId;

  beforeEach(async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_TICKET);
    ticketId = res.body.id;
  });

  afterEach(async () => {
    if (ticketId) {
      await request(app)
        .delete(`${BASE}/${ticketId}`)
        .set('Authorization', `Bearer ${await loginAsAdmin()}`);
      ticketId = null;
    }
  });

  it('should transfer a ticket to another team', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .post(`${BASE}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ticketId, toTeam: 'Cybersecurity Team', note: 'IT-TEST-Transfer note' })
      .expect(200);

    expect(res.body.assigned_team).toBe('Cybersecurity Team');
  });

  it('should record transfer in history', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .post(`${BASE}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ticketId, toTeam: 'IT Team' })
      .expect(200);

    const ticket = await request(app)
      .get(`${BASE}/${ticketId}`)
      .set('Authorization', `Bearer ${token}`);

    const transferEntry = ticket.body.history.find(h => h.action === 'Transferred');
    expect(transferEntry).toBeDefined();
  });
});

describe('PATCH /api/tickets/:id/work-notes', () => {
  let ticketId;

  beforeEach(async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_TICKET);
    ticketId = res.body.id;
  });

  afterEach(async () => {
    if (ticketId) {
      await request(app)
        .delete(`${BASE}/${ticketId}`)
        .set('Authorization', `Bearer ${await loginAsAdmin()}`);
      ticketId = null;
    }
  });

  it('should add work notes', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .patch(`${BASE}/${ticketId}/work-notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ workNotes: 'IT-TEST-First work note' })
      .expect(200);

    expect(res.body.work_notes).toContain('IT-TEST-First work note');
  });

  it('should append multiple work notes', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .patch(`${BASE}/${ticketId}/work-notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ workNotes: 'Note 1' })
      .expect(200);

    const res = await request(app)
      .patch(`${BASE}/${ticketId}/work-notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ workNotes: 'Note 2' })
      .expect(200);

    expect(res.body.work_notes).toContain('Note 1');
    expect(res.body.work_notes).toContain('Note 2');
  });

  it('should return 404 for non-existent ticket', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .patch(`${BASE}/99999/work-notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ workNotes: 'Note' })
      .expect(404);
  });

  it('should reject empty work notes', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .patch(`${BASE}/${ticketId}/work-notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ workNotes: '' })
      .expect(400);
  });
});

describe('DELETE /api/tickets/:id', () => {
  let ticketId;

  beforeEach(async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_TICKET);
    ticketId = res.body.id;
  });

  it('should delete a ticket', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .delete(`${BASE}/${ticketId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.message).toBe('Ticket deleted');
    expect(res.body.ticket.id).toBe(ticketId);
  });

  it('should return 404 for non-existent ticket', async () => {
    const token = await loginAsAdmin();
    await request(app)
      .delete(`${BASE}/99999`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('should deny Network Team from deleting tickets', async () => {
    const { id, token } = await require('./helpers').createTestUser(
      'Network Team Test', 'itest-net-tkt@example.com', 'Network Team'
    );
    try {
      await request(app)
        .delete(`${BASE}/${ticketId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    } finally {
      await require('./helpers').cleanupTestUser(id);
    }
  });
});

describe('GET /api/tickets/users/search', () => {
  it('should search users for ticket creation', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(`${BASE}/users/search?q=test`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should return empty array for no match', async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .get(`${BASE}/users/search?q=zzz_nonexistent_user`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual([]);
  });
});

describe('History integrity', () => {
  let ticketId;

  beforeEach(async () => {
    const token = await loginAsAdmin();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_TICKET);
    ticketId = res.body.id;
  });

  afterEach(async () => {
    if (ticketId) {
      await request(app)
        .delete(`${BASE}/${ticketId}`)
        .set('Authorization', `Bearer ${await loginAsAdmin()}`);
      ticketId = null;
    }
  });

  it('should have consistent history after status change + transfer', async () => {
    const token = await loginAsAdmin();

    // Status change
    await request(app)
      .patch(`${BASE}/${ticketId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'In Progress' })
      .expect(200);

    // Transfer
    await request(app)
      .post(`${BASE}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ticketId, toTeam: 'IT Team' })
      .expect(200);

    const ticket = await request(app)
      .get(`${BASE}/${ticketId}`)
      .set('Authorization', `Bearer ${token}`);

    const actions = ticket.body.history.map(h => h.action);
    expect(actions).toContain('Created');
    expect(actions).toContain('Status Updated');
    expect(actions).toContain('Transferred');
    expect(actions.length).toBe(3);
  });
});
