import api from "./api";

export const getUsers = async (params = {}) => (await api.get("/api/users", { params })).data;
export const createUser = async (payload) => (await api.post("/api/users", payload)).data;
export const editUserApi = async (id, payload) => (await api.patch(`/api/users/${id}`, payload)).data;
export const activateUser = async (id) => (await api.patch(`/api/users/${id}/activate`)).data;
export const deactivateUser = async (id) => (await api.patch(`/api/users/${id}/deactivate`)).data;
export const searchUsers = async (q) => (await api.get(`/api/users/search?q=${encodeURIComponent(q)}`)).data;
