const { executeQuery } = require("../config/db");

const getStats = async () => {
  const total = await executeQuery("SELECT COUNT(*) AS cnt FROM inventory");
  const assigned = await executeQuery(
    "SELECT COUNT(*) AS cnt FROM inventory WHERE asset_current_status = 'Assigned'"
  );
  const available = await executeQuery(
    "SELECT COUNT(*) AS cnt FROM inventory WHERE asset_current_status = 'Available'"
  );
  const inMaintenance = await executeQuery(
    "SELECT COUNT(*) AS cnt FROM inventory WHERE asset_current_status = 'In Maintenance'"
  );
  const openTickets = await executeQuery(
    "SELECT COUNT(*) AS cnt FROM tickets WHERE status = 'Open'"
  );

  const recentAssets = await executeQuery(
    `SELECT asset_id, asset_description, make_brand_model, asset_user,
            asset_current_status, mdo_location, room, floor
     FROM inventory ORDER BY created_at DESC
     LIMIT 5`,
    []
  );

  const recentTickets = await executeQuery(
    `SELECT t.id, t.title, t.status, u.name AS created_by_name
     FROM tickets t
     LEFT JOIN users u ON u.id = t.created_by
     ORDER BY t.created_at DESC
     LIMIT 5`,
    []
  );

  return {
    totalAssets: parseInt(total.rows[0]?.cnt || 0, 10),
    assignedAssets: parseInt(assigned.rows[0]?.cnt || 0, 10),
    availableAssets: parseInt(available.rows[0]?.cnt || 0, 10),
    inMaintenance: parseInt(inMaintenance.rows[0]?.cnt || 0, 10),
    openTickets: parseInt(openTickets.rows[0]?.cnt || 0, 10),
    recentAssets: recentAssets.rows || [],
    recentTickets: recentTickets.rows || []
  };
};

module.exports = { getStats };
