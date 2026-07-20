import api from "./api";

export const listTickets = async () => (await api.get("/api/tickets")).data;
export const createTicket = async (payload) => (await api.post("/api/tickets", payload)).data;
export const transferTicket = async (payload) => (await api.post("/api/tickets/transfer", payload)).data;
export const updateTicketStatus = async (id, status) => (await api.patch(`/api/tickets/${id}/status`, { status })).data;
export const addTicketWorkNotes = async (id, workNotes) => (await api.patch(`/api/tickets/${id}/work-notes`, { workNotes })).data;
