import api from "./api";

export const getSettings = async () => (await api.get("/api/settings")).data;
export const updateNotifications = async (payload) => (await api.patch("/api/settings/notifications", payload)).data;
