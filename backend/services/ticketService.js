const { executeQuery } = require("../config/db");
const ApiError = require("../utils/ApiError");

const TEAM_MAP = {
  help_desk: "IT Help Desk",
  it_team: "IT Team",
  network_team: "Network Team",
  cybersecurity_team: "Cybersecurity Team"
};

const validTeams = Object.values(TEAM_MAP);

const createTicket = async (payload, actorUserId) => {
  const assignedTeam = "IT Help Desk";
  const result = await executeQuery(
    `INSERT INTO tickets
      (title, description, status, created_by, assigned_team, inventory_id, work_notes)
     RETURNING *
     VALUES ($1, $2, 'Open', $3, $4, $5, $6)`,
    [
      payload.title,
      payload.description,
      actorUserId,
      assignedTeam,
      payload.inventory_id || null,
      payload.work_notes || null
    ]
  );

  const ticket = result.rows[0];
  await executeQuery(
    `INSERT INTO ticket_history (ticket_id, action, from_team, to_team, note, performed_by)
     VALUES ($1, 'Created', NULL, $2, $3, $4)`,
    [ticket.id, assignedTeam, "Default assignment to IT Help Desk", actorUserId]
  );
  return ticket;
};

const ALLOWED_TICKET_SORT_COLUMNS = [
  "id", "title", "status", "assigned_team", "created_by",
  "inventory_id", "created_at", "updated_at", "created_by_name"
];

const listTickets = async (pagination, filters = {}) => {
  const conditions = [];
  const params = [];

  const addCondition = (sqlClause, value) => {
    if (value === undefined || value === null || value === "") return;
    conditions.push(sqlClause);
    params.push(value);
  };

  addCondition("t.status = $1", filters.status);
  addCondition("t.assigned_team = $1", filters.assigned_team);

  if (filters.search && filters.search.trim()) {
    const searchTerm = `%${filters.search.trim()}%`;
    const searchFields = ["t.title", "t.description", "u.name"];
    const searchClause = searchFields.map(() => `$${params.length + 1}`).join(" OR ");
    conditions.push(`(${searchClause})`);
    params.push(searchTerm);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sortBy =
    pagination.sortBy && ALLOWED_TICKET_SORT_COLUMNS.includes(pagination.sortBy)
      ? pagination.sortBy
      : "t.created_at";

  const orderClause = `ORDER BY ${sortBy} ${pagination.sortDirection}`;

  // Separate count query
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM tickets t
    INNER JOIN users u ON u.id = t.created_by
    ${whereClause}
  `;
  const countResult = await executeQuery(countQuery, params.slice(0, params.length - 2));
  const total = parseInt(countResult.rows[0]?.total || 0, 10);

  const query = `
    SELECT t.*, u.name AS created_by_name
    FROM tickets t
    INNER JOIN users u ON u.id = t.created_by
    ${whereClause}
    ${orderClause}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const allParams = [...params, pagination.pageSize, pagination.offset];
  const result = await executeQuery(query, allParams);
  return { data: result.rows, total };
};

const getTicketById = async (id) => {
  const result = await executeQuery("SELECT * FROM tickets WHERE id = $1", [Number(id)]);
  const ticket = result.rows[0];
  if (!ticket) throw new ApiError(404, "Ticket not found");

  const history = await executeQuery(
    `SELECT h.*, u.name AS performed_by_name
     FROM ticket_history h
     LEFT JOIN users u ON u.id = h.performed_by
     WHERE h.ticket_id = $1
     ORDER BY h.created_at ASC`,
    [Number(id)]
  );
  return { ...ticket, history: history.rows };
};

const assignTeam = async (id, toTeam, actorUserId, note = null) => {
  if (!validTeams.includes(toTeam)) throw new ApiError(400, "Invalid team");
  const ticketResult = await executeQuery("SELECT * FROM tickets WHERE id = $1", [Number(id)]);
  const ticket = ticketResult.rows[0];
  if (!ticket) throw new ApiError(404, "Ticket not found");

  await executeQuery(
    "UPDATE tickets SET assigned_team = $1, updated_at = NOW() WHERE id = $2",
    [toTeam, Number(id)]
  );

  await executeQuery(
    `INSERT INTO ticket_history (ticket_id, action, from_team, to_team, note, performed_by)
     VALUES ($1, 'Assigned', $2, $3, $4, $5)`,
    [Number(id), ticket.assigned_team, toTeam, note || "Assignment updated", actorUserId]
  );

  return getTicketById(id);
};

const transferTicket = async (id, toTeam, actorUserId, note = null) => {
  if (!validTeams.includes(toTeam)) throw new ApiError(400, "Invalid team");
  const ticketResult = await executeQuery("SELECT * FROM tickets WHERE id = $1", [Number(id)]);
  const ticket = ticketResult.rows[0];
  if (!ticket) throw new ApiError(404, "Ticket not found");

  await executeQuery(
    "UPDATE tickets SET assigned_team = $1, updated_at = NOW() WHERE id = $2",
    [toTeam, Number(id)]
  );

  await executeQuery(
    `INSERT INTO ticket_history (ticket_id, action, from_team, to_team, note, performed_by)
     VALUES ($1, 'Transferred', $2, $3, $4, $5)`,
    [Number(id), ticket.assigned_team, toTeam, note || "Transferred", actorUserId]
  );

  return getTicketById(id);
};

const updateStatus = async (id, status, actorUserId) => {
  const allowed = ["Open", "In Progress", "Pending", "Resolved", "Closed"];
  if (!allowed.includes(status)) throw new ApiError(400, "Invalid status");

  // Capture current status before update
  const current = await executeQuery("SELECT status, assigned_team FROM tickets WHERE id = $1", [
    Number(id)
  ]);
  const ticket = current.rows[0];
  if (!ticket) throw new ApiError(404, "Ticket not found");

  const result = await executeQuery(
    "UPDATE tickets SET status = $1, updated_at = NOW() RETURNING * WHERE id = $2",
    [status, Number(id)]
  );
  const updated = result.rows[0];
  if (!updated) throw new ApiError(404, "Ticket not found");

  await executeQuery(
    `INSERT INTO ticket_history (ticket_id, action, from_team, to_team, note, performed_by)
     VALUES ($1, 'Status Updated', $2, $3, $4, $5)`,
    [
      Number(id),
      ticket.assigned_team,
      updated.assigned_team,
      `${ticket.status} → ${status}`,
      actorUserId
    ]
  );
  return updated;
};

const addWorkNotes = async (id, workNotes, actorUserId) => {
  const ticketResult = await executeQuery("SELECT * FROM tickets WHERE id = $1", [Number(id)]);
  const ticket = ticketResult.rows[0];
  if (!ticket) throw new ApiError(404, "Ticket not found");

  const merged = ticket.work_notes
    ? `${ticket.work_notes}\n${new Date().toISOString()} - ${workNotes}`
    : `${new Date().toISOString()} - ${workNotes}`;

  const result = await executeQuery(
    "UPDATE tickets SET work_notes=$1, updated_at=NOW() RETURNING * WHERE id=$2",
    [merged, Number(id)]
  );

  await executeQuery(
    `INSERT INTO ticket_history (ticket_id, action, from_team, to_team, note, performed_by)
     VALUES ($1, 'Work Note Added', $2, $3, $4, $5)`,
    [
      Number(id),
      ticket.assigned_team,
      ticket.assigned_team,
      workNotes.slice(0, 500),
      actorUserId
    ]
  );

  return result.rows[0];
};

const deleteTicket = async (id, actorUserId) => {
  const ticketResult = await executeQuery("SELECT * FROM tickets WHERE id = $1", [Number(id)]);
  const ticket = ticketResult.rows[0];
  if (!ticket) throw new ApiError(404, "Ticket not found");

  await executeQuery(
    `INSERT INTO ticket_history (ticket_id, action, from_team, to_team, note, performed_by)
     VALUES ($1, 'Deleted', $2, NULL, $3, $4)`,
    [Number(id), ticket.assigned_team, "Ticket deleted", actorUserId]
  );

  // Delete history first to respect FK constraint, then delete ticket
  await executeQuery("DELETE FROM ticket_history WHERE ticket_id = $1", [Number(id)]);
  await executeQuery("DELETE FROM tickets WHERE id = $1", [Number(id)]);
  return ticket;
};

const searchUsers = async (q) => {
  const pattern = `%${q}%`;
  const result = await executeQuery(
    `SELECT i.id, i.asset_user, i.email, i.phone
     FROM inventory i
     WHERE i.asset_user LIKE $1 OR i.email LIKE $1 OR i.phone LIKE $1
     ORDER BY i.asset_user
     LIMIT 10`,
    [pattern]
  );
  return result.rows || [];
};

module.exports = {
  createTicket,
  listTickets,
  getTicketById,
  assignTeam,
  transferTicket,
  updateStatus,
  addWorkNotes,
  deleteTicket,
  searchUsers,
  validTeams
};
