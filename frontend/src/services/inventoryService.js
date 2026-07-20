import api from "./api";

export const listInventory = async () => (await api.get("/api/inventory")).data;
export const addInventory = async (payload) => (await api.post("/api/inventory", payload)).data;
export const getDropdowns = async () => (await api.get("/api/inventory/dropdowns")).data;
export const addDropdownValue = async (payload) => (await api.post("/api/inventory/dropdowns", payload)).data;
export const searchInventoryUser = async (q) => (await api.get(`/api/inventory/search-user?q=${encodeURIComponent(q)}`)).data;
