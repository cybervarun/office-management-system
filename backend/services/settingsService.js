const { executeQuery } = require("../config/db");
const { ROLES, TEAMS } = require("../utils/constants");

const getSettings = async () => {
  const roleStats = await executeQuery(`
    SELECT role, COUNT(*) AS count
    FROM users
    GROUP BY role
  `);

  const notifications = {
    emailAlerts: true,
    ticketAssignments: true,
    assetStatusChanges: false,
    weeklyDigest: true,
    securityAlerts: true
  };

  const systemInfo = {
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    maxTeams: TEAMS.length,
    maxRoles: ROLES.length
  };

  return {
    roles: ROLES,
    teams: TEAMS,
    roleStats: roleStats.rows,
    notifications,
    systemInfo
  };
};

const updateNotifications = async (updates) => {
  const allowed = [
    "emailAlerts", "ticketAssignments", "assetStatusChanges",
    "weeklyDigest", "securityAlerts"
  ];

  const filtered = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      filtered[key] = typeof updates[key] === "boolean" ? updates[key] : !!updates[key];
    }
  }

  return { message: "Settings updated", ...filtered };
};

module.exports = { getSettings, updateNotifications };
