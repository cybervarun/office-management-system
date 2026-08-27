const asyncHandler = require("../utils/asyncHandler");
const reportsService = require("../services/reportsService");

const getReports = asyncHandler(async (req, res) => {
  const reports = await reportsService.getReports();
  res.json(reports);
});

module.exports = { getReports };
