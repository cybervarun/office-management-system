const asyncHandler = require("../utils/asyncHandler");
const { executeQuery } = require("../config/db");

const getStats = asyncHandler(async (req, res) => {
  const total = await executeQuery("SELECT COUNT(*) as cnt FROM inventory");
  const assigned = await executeQuery("SELECT COUNT(*) as cnt FROM inventory WHERE asset_current_status = 'Assigned'");
  const available = await executeQuery("SELECT COUNT(*) as cnt FROM inventory WHERE asset_current_status = 'Available'");
  const inMaintenance = await executeQuery("SELECT COUNT(*) as cnt FROM inventory WHERE asset_current_status = 'In Maintenance'");
  const openTickets = await executeQuery("SELECT COUNT(*) as cnt FROM tickets WHERE status = 'Open'");

  const recentAssets = await executeQuery(
    `SELECT TOP 5 asset_id, asset_description, make_brand_model, asset_user, asset_current_status, mdo_location, room, floor
     FROM inventory ORDER BY created_at DESC`,
    []
  );

  const recentTickets = await executeQuery(
    `SELECT TOP 5 t.id, t.title, t.status, u.name AS created_by_name
     FROM tickets t
     LEFT JOIN users u ON u.id = t.created_by
     ORDER BY t.created_at DESC`,
    []
  );

  res.json({
    totalAssets: total.recordset[0].cnt,
    assignedAssets: assigned.recordset[0].cnt,
    availableAssets: available.recordset[0].cnt,
    inMaintenance: inMaintenance.recordset[0].cnt,
    openTickets: openTickets.recordset[0].cnt,
    recentAssets: recentAssets.recordset || [],
    recentTickets: recentTickets.recordset || []
  });
});

module.exports = { getStats };
