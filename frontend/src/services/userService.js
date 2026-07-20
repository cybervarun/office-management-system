import api from "./api";

export const getUsers = async () => (await api.get("/api/users")).data;
export const createUser = async (payload) => (await api.post("/api/users", payload)).data;
export const searchUsers = async (q) => (await api.get(`/api/users/search?q=${encodeURIComponent(q)}`)).data;
