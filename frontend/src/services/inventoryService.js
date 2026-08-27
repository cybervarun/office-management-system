import api from "./api";

export const listInventory = async (params = {}) => (await api.get("/api/inventory", { params })).data;
export const addInventory = async (payload) => (await api.post("/api/inventory", payload)).data;
export const editInventory = async (id, payload) => (await api.put(`/api/inventory/${id}`, payload)).data;
export const getAsset = async (id) => (await api.get(`/api/inventory/${id}`)).data;
export const deleteInventory = async (id) => (await api.delete(`/api/inventory/${id}`)).data;
export const getDropdowns = async () => (await api.get("/api/inventory/dropdowns")).data;
export const addDropdownValue = async (payload) => (await api.post("/api/inventory/dropdowns", payload)).data;
export const searchInventoryUser = async (q) => (await api.get(`/api/inventory/search-user?q=${encodeURIComponent(q)}`)).data;
export const getDashboardStats = async () => (await api.get("/api/dashboard")).data;
