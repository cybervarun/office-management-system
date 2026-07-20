const { getPool, executeQuery, sql } = require("../config/db");
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
    OUTPUT INSERTED.*
    VALUES
    (@title, @description, 'Open', @created_by, @assigned_team, @inventory_id, @work_notes)`,
    [
      { name: "title", type: sql.NVarChar(255), value: payload.title },
      { name: "description", type: sql.NVarChar(sql.MAX), value: payload.description },
      { name: "created_by", type: sql.Int, value: actorUserId },
      { name: "assigned_team", type: sql.NVarChar(100), value: assignedTeam },
      { name: "inventory_id", type: sql.Int, value: payload.inventory_id || null },
      { name: "work_notes", type: sql.NVarChar(sql.MAX), value: payload.work_notes || null }
    ]
  );

  const ticket = result.recordset[0];
  await executeQuery(
    `INSERT INTO ticket_history (ticket_id, action, from_team, to_team, note, performed_by)
     VALUES (@ticket_id, 'Created', NULL, @to_team, @note, @performed_by)`,
    [
      { name: "ticket_id", type: sql.Int, value: ticket.id },
      { name: "to_team", type: sql.NVarChar(100), value: assignedTeam },
      { name: "note", type: sql.NVarChar(500), value: "Default assignment to IT Help Desk" },
      { name: "performed_by", type: sql.Int, value: actorUserId }
    ]
  );
  return ticket;
};

const listTickets = async () => {
  const result = await executeQuery(
    `SELECT t.*, u.name AS created_by_name
     FROM tickets t
     INNER JOIN users u ON u.id = t.created_by
     ORDER BY t.created_at DESC`
  );
  return result.recordset;
};

const getTicketById = async (id) => {
  const result = await executeQuery("SELECT * FROM tickets WHERE id = @id", [
    { name: "id", type: sql.Int, value: Number(id) }
  ]);
  const ticket = result.recordset[0];
  if (!ticket) throw new ApiError(404, "Ticket not found");

  const history = await executeQuery(
    `SELECT h.*, u.name AS performed_by_name
     FROM ticket_history h
     LEFT JOIN users u ON u.id = h.performed_by
     WHERE h.ticket_id = @ticket_id
     ORDER BY h.created_at ASC`,
    [{ name: "ticket_id", type: sql.Int, value: Number(id) }]
  );
  return { ...ticket, history: history.recordset };
};

const assignTeam = async (id, toTeam, actorUserId, note = null) => {
  if (!validTeams.includes(toTeam)) throw new ApiError(400, "Invalid team");
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const currentRequest = new sql.Request(transaction);
    currentRequest.input("id", sql.Int, Number(id));
    const current = await currentRequest.query("SELECT * FROM tickets WHERE id = @id");
    const ticket = current.recordset[0];
    if (!ticket) throw new ApiError(404, "Ticket not found");

    const updateRequest = new sql.Request(transaction);
    updateRequest.input("id", sql.Int, Number(id));
    updateRequest.input("assigned_team", sql.NVarChar(100), toTeam);
    await updateRequest.query(
      "UPDATE tickets SET assigned_team=@assigned_team, updated_at=SYSUTCDATETIME() WHERE id=@id"
    );

    const histRequest = new sql.Request(transaction);
    histRequest.input("ticket_id", sql.Int, Number(id));
    histRequest.input("from_team", sql.NVarChar(100), ticket.assigned_team);
    histRequest.input("to_team", sql.NVarChar(100), toTeam);
    histRequest.input("note", sql.NVarChar(500), note || "Assignment updated");
    histRequest.input("performed_by", sql.Int, actorUserId);
    await histRequest.query(
      `INSERT INTO ticket_history (ticket_id, action, from_team, to_team, note, performed_by)
       VALUES (@ticket_id, 'Assigned', @from_team, @to_team, @note, @performed_by)`
    );

    await transaction.commit();
    return getTicketById(id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const transferTicket = async (id, toTeam, actorUserId, note = null) => {
  if (!validTeams.includes(toTeam)) throw new ApiError(400, "Invalid team");
  const ticketResult = await executeQuery("SELECT * FROM tickets WHERE id = @id", [
    { name: "id", type: sql.Int, value: Number(id) }
  ]);
  const ticket = ticketResult.recordset[0];
  if (!ticket) throw new ApiError(404, "Ticket not found");

  await executeQuery(
    "UPDATE tickets SET assigned_team = @assigned_team, updated_at = SYSUTCDATETIME() WHERE id = @id",
    [
      { name: "id", type: sql.Int, value: Number(id) },
      { name: "assigned_team", type: sql.NVarChar(100), value: toTeam }
    ]
  );

  await executeQuery(
    `INSERT INTO ticket_history (ticket_id, action, from_team, to_team, note, performed_by)
     VALUES (@ticket_id, 'Transferred', @from_team, @to_team, @note, @performed_by)`,
    [
      { name: "ticket_id", type: sql.Int, value: Number(id) },
      { name: "from_team", type: sql.NVarChar(100), value: ticket.assigned_team },
      { name: "to_team", type: sql.NVarChar(100), value: toTeam },
      { name: "note", type: sql.NVarChar(500), value: note || "Transferred" },
      { name: "performed_by", type: sql.Int, value: actorUserId }
    ]
  );

  return getTicketById(id);
};

const updateStatus = async (id, status, actorUserId) => {
  const allowed = ["Open", "In Progress", "Pending", "Resolved", "Closed"];
  if (!allowed.includes(status)) throw new ApiError(400, "Invalid status");
  const result = await executeQuery(
    "UPDATE tickets SET status = @status, updated_at = SYSUTCDATETIME() OUTPUT INSERTED.* WHERE id = @id",
    [
      { name: "id", type: sql.Int, value: Number(id) },
      { name: "status", type: sql.NVarChar(50), value: status }
    ]
  );
  const ticket = result.recordset[0];
  if (!ticket) throw new ApiError(404, "Ticket not found");

  await executeQuery(
    `INSERT INTO ticket_history (ticket_id, action, from_team, to_team, note, performed_by)
     VALUES (@ticket_id, 'Status Updated', @from_team, @to_team, @note, @performed_by)`,
    [
      { name: "ticket_id", type: sql.Int, value: Number(id) },
      { name: "from_team", type: sql.NVarChar(100), value: ticket.assigned_team },
      { name: "to_team", type: sql.NVarChar(100), value: ticket.assigned_team },
      { name: "note", type: sql.NVarChar(500), value: `Status changed to ${status}` },
      { name: "performed_by", type: sql.Int, value: actorUserId }
    ]
  );
  return ticket;
};

const addWorkNotes = async (id, workNotes, actorUserId) => {
  const ticketResult = await executeQuery("SELECT * FROM tickets WHERE id = @id", [
    { name: "id", type: sql.Int, value: Number(id) }
  ]);
  const ticket = ticketResult.recordset[0];
  if (!ticket) throw new ApiError(404, "Ticket not found");

  const merged = ticket.work_notes
    ? `${ticket.work_notes}\n${new Date().toISOString()} - ${workNotes}`
    : `${new Date().toISOString()} - ${workNotes}`;

  const result = await executeQuery(
    "UPDATE tickets SET work_notes=@work_notes, updated_at=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE id=@id",
    [
      { name: "id", type: sql.Int, value: Number(id) },
      { name: "work_notes", type: sql.NVarChar(sql.MAX), value: merged }
    ]
  );

  await executeQuery(
    `INSERT INTO ticket_history (ticket_id, action, from_team, to_team, note, performed_by)
     VALUES (@ticket_id, 'Work Note Added', @from_team, @to_team, @note, @performed_by)`,
    [
      { name: "ticket_id", type: sql.Int, value: Number(id) },
      { name: "from_team", type: sql.NVarChar(100), value: ticket.assigned_team },
      { name: "to_team", type: sql.NVarChar(100), value: ticket.assigned_team },
      { name: "note", type: sql.NVarChar(500), value: workNotes.slice(0, 500) },
      { name: "performed_by", type: sql.Int, value: actorUserId }
    ]
  );

  return result.recordset[0];
};

module.exports = {
  createTicket,
  listTickets,
  getTicketById,
  assignTeam,
  transferTicket,
  updateStatus,
  addWorkNotes,
  validTeams
};
