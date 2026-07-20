const asyncHandler = require("../utils/asyncHandler");
const ticketService = require("../services/ticketService");

const createTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.createTicket(req.body, req.user.id);
  res.status(201).json(ticket);
});

const listTickets = asyncHandler(async (req, res) => {
  const tickets = await ticketService.listTickets();
  res.json(tickets);
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

module.exports = {
  createTicket,
  listTickets,
  getTicket,
  assignTeam,
  transferTicket,
  updateStatus,
  addWorkNotes
};
