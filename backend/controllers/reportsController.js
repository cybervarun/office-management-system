const asyncHandler = require("../utils/asyncHandler");
const { executeQuery } = require("../config/db");

const getReports = asyncHandler(async (req, res) => {
  // Assets by status
  const assetsByStatus = await executeQuery(`
    SELECT asset_current_status AS label, COUNT(*) AS count
    FROM inventory
    GROUP BY asset_current_status
    ORDER BY count DESC
  `);

  // Assets by ministry (top 10)
  const assetsByMinistry = await executeQuery(`
    SELECT ministry AS label, COUNT(*) AS count
    FROM inventory
    WHERE ministry IS NOT NULL AND ministry <> ''
    GROUP BY ministry
    ORDER BY count DESC
    OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY
  `);

  // Tickets by team
  const ticketsByTeam = await executeQuery(`
    SELECT assigned_team AS label, COUNT(*) AS count
    FROM tickets
    GROUP BY assigned_team
    ORDER BY count DESC
  `);

  // Tickets by status
  const ticketsByStatus = await executeQuery(`
    SELECT status AS label, COUNT(*) AS count
    FROM tickets
    GROUP BY status
    ORDER BY count DESC
  `);

  // Recent ticket activity (last 30 days)
  const ticketTrend = await executeQuery(`
    SELECT
      CONVERT(date, created_at) AS date,
      COUNT(*) AS count
    FROM tickets
    WHERE created_at >= DATEADD(day, -30, SYSUTCDATETIME())
    GROUP BY CONVERT(date, created_at)
    ORDER BY date DESC
  `);

  // Total counts
  const totalAssets = await executeQuery("SELECT COUNT(*) AS cnt FROM inventory");
  const totalTickets = await executeQuery("SELECT COUNT(*) AS cnt FROM tickets");
  const openTickets = await executeQuery("SELECT COUNT(*) AS cnt FROM tickets WHERE status = 'Open'");
  const resolvedTickets = await executeQuery("SELECT COUNT(*) AS cnt FROM tickets WHERE status IN ('Resolved', 'Closed')");

  // Users by role
  const usersByRole = await executeQuery(`
    SELECT role AS label, COUNT(*) AS count
    FROM users
    GROUP BY role
    ORDER BY count DESC
  `);

  res.json({
    assetsByStatus: assetsByStatus.recordset,
    assetsByMinistry: assetsByMinistry.recordset,
    ticketsByTeam: ticketsByTeam.recordset,
    ticketsByStatus: ticketsByStatus.recordset,
    ticketTrend: ticketTrend.recordset.map(r => ({
      date: r.date,
      count: r.count
    })).reverse(),
    totals: {
      totalAssets: totalAssets.recordset[0]?.cnt || 0,
      totalTickets: totalTickets.recordset[0]?.cnt || 0,
      openTickets: openTickets.recordset[0]?.cnt || 0,
      resolvedTickets: resolvedTickets.recordset[0]?.cnt || 0
    },
    usersByRole: usersByRole.recordset
  });
});

module.exports = { getReports };
