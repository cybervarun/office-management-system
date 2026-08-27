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
    assetsByStatus: assetsByStatus.rows.map(r => ({ label: r.label, count: parseInt(r.count, 10) })),
    assetsByMinistry: assetsByMinistry.rows.map(r => ({ label: r.label, count: parseInt(r.count, 10) })),
    ticketsByTeam: ticketsByTeam.rows.map(r => ({ label: r.label, count: parseInt(r.count, 10) })),
    ticketsByStatus: ticketsByStatus.rows.map(r => ({ label: r.label, count: parseInt(r.count, 10) })),
    ticketTrend: ticketTrend.rows.map(r => ({
      date: r.date,
      count: parseInt(r.count, 10)
    })).reverse(),
    totals: {
      totalAssets: parseInt(totalAssets.rows[0]?.cnt || 0, 10),
      totalTickets: parseInt(totalTickets.rows[0]?.cnt || 0, 10),
      openTickets: parseInt(openTickets.rows[0]?.cnt || 0, 10),
      resolvedTickets: parseInt(resolvedTickets.rows[0]?.cnt || 0, 10)
    },
    usersByRole: usersByRole.rows.map(r => ({ label: r.label, count: parseInt(r.count, 10) })),
  };
};

module.exports = { getReports };
