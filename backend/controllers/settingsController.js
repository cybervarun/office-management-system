const asyncHandler = require("../utils/asyncHandler");
const { executeQuery, sql } = require("../config/db");
const ApiError = require("../utils/ApiError");

const getSettings = asyncHandler(async (req, res) => {
  // Role-based permissions from constants
  const { ROLES, TEAMS } = require("../models/constants");

  // Count users per role
  const roleStats = await executeQuery(`
    SELECT role, COUNT(*) AS count
    FROM users
    GROUP BY role
  `);

  // Notification config defaults
  const notifications = {
    emailAlerts: true,
    ticketAssignments: true,
    assetStatusChanges: false,
    weeklyDigest: true,
    securityAlerts: true
  };

  // System info
  const systemInfo = {
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    maxTeams: TEAMS.length,
    maxRoles: ROLES.length
  };

  res.json({
    roles: ROLES,
    teams: TEAMS,
    roleStats: roleStats.recordset,
    notifications,
    systemInfo
  });
});

const updateNotifications = asyncHandler(async (req, res) => {
  // In a real app, this would be stored in a settings table per user or globally
  const allowed = [
    "emailAlerts", "ticketAssignments", "assetStatusChanges",
    "weeklyDigest", "securityAlerts"
  ];

  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[key] = typeof req.body[key] === "boolean" ? req.body[key] : !!req.body[key];
    }
  }

  res.json({ message: "Settings updated", ...updates });
});

module.exports = { getSettings, updateNotifications };
