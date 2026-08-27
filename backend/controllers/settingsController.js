const asyncHandler = require("../utils/asyncHandler");
const settingsService = require("../services/settingsService");

const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings();
  res.json(settings);
});

const updateNotifications = asyncHandler(async (req, res) => {
  const result = await settingsService.updateNotifications(req.body);
  res.json(result);
});

module.exports = { getSettings, updateNotifications };
