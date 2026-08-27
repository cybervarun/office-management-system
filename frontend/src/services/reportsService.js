import api from "./api";

export const getReports = async () => (await api.get("/api/reports")).data;
