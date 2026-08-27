const { executeQuery } = require("../config/db");

const getReports = async () => {
  const assetsByStatus = await executeQuery(`
    SELECT asset_current_status AS label, COUNT(*) AS count
    FROM inventory
    GROUP BY asset_current_status
    ORDER BY count DESC
  `);

  const assetsByMinistry = await executeQuery(`
    SELECT ministry AS label, COUNT(*) AS count
    FROM inventory
    WHERE ministry IS NOT NULL AND ministry <> ''
    GROUP BY ministry
    ORDER BY count DESC
    LIMIT 10 OFFSET 0
  `);

  const ticketsByTeam = await executeQuery(`
    SELECT assigned_team AS label, COUNT(*) AS count
    FROM tickets
    GROUP BY assigned_team
    ORDER BY count DESC
  `);

  const ticketsByStatus = await executeQuery(`
    SELECT status AS label, COUNT(*) AS count
    FROM tickets
    GROUP BY status
    ORDER BY count DESC
  `);

  const ticketTrend = await executeQuery(`
    SELECT
      DATE(created_at) AS date,
      COUNT(*) AS count
    FROM tickets
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `);

  const totalAssets = await executeQuery("SELECT COUNT(*) AS cnt FROM inventory");
  const totalTickets = await executeQuery("SELECT COUNT(*) AS cnt FROM tickets");
  const openTickets = await executeQuery("SELECT COUNT(*) AS cnt FROM tickets WHERE status = 'Open'");
  const resolvedTickets = await executeQuery(
    "SELECT COUNT(*) AS cnt FROM tickets WHERE status IN ('Resolved', 'Closed')"
  );

  const usersByRole = await executeQuery(`
    SELECT role AS label, COUNT(*) AS count
    FROM users
    GROUP BY role
    ORDER BY count DESC
  `);

  return {
    assetsByStatus: assetsByStatus.rows,
    assetsByMinistry: assetsByMinistry.rows,
    ticketsByTeam: ticketsByTeam.rows,
    ticketsByStatus: ticketsByStatus.rows,
    ticketTrend: ticketTrend.rows.map(r => ({
      date: r.date,
      count: r.count
    })).reverse(),
    totals: {
      totalAssets: totalAssets.rows[0]?.cnt || 0,
      totalTickets: totalTickets.rows[0]?.cnt || 0,
      openTickets: openTickets.rows[0]?.cnt || 0,
      resolvedTickets: resolvedTickets.rows[0]?.cnt || 0
    },
    usersByRole: usersByRole.rows
  };
};

module.exports = { getReports };
