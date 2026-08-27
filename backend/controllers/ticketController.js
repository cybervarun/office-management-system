const asyncHandler = require("../utils/asyncHandler");
const ticketService = require("../services/ticketService");
const { executeQuery, sql } = require("../config/db");
const { parsePagination, paginatedResponse } = require("../utils/pagination");

const createTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.createTicket(req.body, req.user.id);
  res.status(201).json(ticket);
});

const listTickets = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { defaultSort: "t.created_at", defaultDirection: "DESC" });
  const filters = {
    search: req.query.search,
    status: req.query.status,
    assigned_team: req.query.assigned_team
  };
  const { data, total } = await ticketService.listTickets(pagination, filters);
  res.json(paginatedResponse(data, total, pagination));
});

const getTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicketById(req.params.id);
  res.json(ticket);
});

const assignTeam = asyncHandler(async (req, res) => {
  const ticket = await ticketService.assignTeam(req.params.id, req.body.toTeam, req.user.id, req.body.note);
  res.json(ticket);
});

const transferTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.transferTicket(req.body.ticketId, req.body.toTeam, req.user.id, req.body.note);
  res.json(ticket);
});

const updateStatus = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateStatus(req.params.id, req.body.status, req.user.id);
  res.json(ticket);
});

const addWorkNotes = asyncHandler(async (req, res) => {
  const ticket = await ticketService.addWorkNotes(req.params.id, req.body.workNotes, req.user.id);
  res.json(ticket);
});

const searchUsers = asyncHandler(async (req, res) => {
  const q = req.query.q || "";
  if (!q.trim()) {
    return res.json([]);
  }
  const pattern = `%${q}%`;
  const result = await executeQuery(
    `SELECT TOP 10 i.id, i.asset_user, i.email, i.phone
     FROM inventory i
     WHERE i.asset_user LIKE @pattern OR i.email LIKE @pattern OR i.phone LIKE @pattern
     ORDER BY i.asset_user`,
    [{ name: "pattern", type: sql.NVarChar(255), value: pattern }]
  );
  res.json(result.recordset || []);
});

const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.deleteTicket(req.params.id, req.user.id);
  res.json({ message: "Ticket deleted", ticket });
});

module.exports = {
  createTicket,
  listTickets,
  getTicket,
  assignTeam,
  transferTicket,
  updateStatus,
  addWorkNotes,
  deleteTicket,
  searchUsers
};
