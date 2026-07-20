const { executeQuery, sql } = require("../config/db");
const ApiError = require("../utils/ApiError");
const crypto = require("crypto");

const dateFields = [
  "purchase_date",
  "date_of_removal",
  "installation_date",
  "end_of_support_date",
  "end_of_life_date",
  "amc_warranty_expiry_date"
];

const allFields = [
  "sr_no","ministry","department","mdo_location","division","asset_id","serial_number","other_asset_category","asset_category",
  "block_name","floor","room","workstation",
  "asset_description","make_brand_model","purchase_date","operating_system","other_operating_system","ip_address","mac_address","network_connection_type",
  "edr_installed","reason_no_edr","uem_installed","reason_no_uem",
  "asset_user","asset_custodian","asset_current_status",
  "date_of_removal","installation_date","end_of_support_date","end_of_life_date","amc_warranty","amc_warranty_expiry_date","critical","remarks",
  "designation","email","phone","custodian"
];

const generateAssetId = (serial, mac) => {
  const source = (serial || mac || "").trim();
  if (!source) throw new Error("Cannot generate Asset ID without serial_number or mac_address");
  const hash = crypto.createHash("sha256").update(source).digest("hex").slice(0, 12).toUpperCase();
  return `ASSET-${hash}`;
};

const findExistingByHardware = async (serial, mac) => {
  const result = await executeQuery(
    `SELECT TOP 1 * FROM inventory WHERE (serial_number IS NOT NULL AND serial_number = @serial) OR (mac_address IS NOT NULL AND mac_address = @mac)`,
    [
      { name: "serial", type: sql.NVarChar(200), value: serial || null },
      { name: "mac", type: sql.NVarChar(50), value: mac || null }
    ]
  );
  return result.recordset[0];
};

const buildInsertQuery = (payload) => {
  const fieldNames = allFields.filter(f => payload.hasOwnProperty(f));
  const placeholders = fieldNames.map(f => `@${f}`).join(", ");
  const columns = fieldNames.join(", ");

  const parameters = fieldNames.map(field => {
    const isDate = dateFields.includes(field);
    return {
      name: field,
      type: isDate ? sql.Date : sql.NVarChar(sql.MAX),
      value: payload[field] === undefined || payload[field] === "" ? null : payload[field]
    };
  });

  return {
    query: `INSERT INTO inventory (${columns}) OUTPUT INSERTED.* VALUES (${placeholders})`,
    parameters
  };
};

const buildUpdateQuery = (id, payload) => {
  // Prevent changing asset_id via update (immutable)
  const payloadSafe = { ...payload };
  delete payloadSafe.asset_id;
  const fieldNames = allFields.filter(f => Object.prototype.hasOwnProperty.call(payloadSafe, f));
  const setClauses = fieldNames.map(f => `${f}=@${f}`).join(", ");

  const parameters = [
    { name: "id", type: sql.Int, value: Number(id) },
    ...fieldNames.map(field => ({
      name: field,
      type: dateFields.includes(field) ? sql.Date : sql.NVarChar(sql.MAX),
      value: payloadSafe[field] === "" || payloadSafe[field] === undefined ? null : payloadSafe[field]
    }))
  ];

  return {
    query: `UPDATE inventory SET ${setClauses}, updated_at=SYSUTCDATETIME() OUTPUT INSERTED.* WHERE id = @id`,
    parameters
  };
};

const addAsset = async (payload) => {
  const serial = payload.serial_number || null;
  const mac = payload.mac_address || null;

  // Require at least one hardware identifier at service level as well
  if (!serial && !mac) {
    throw new ApiError(400, "Either serial_number or mac_address must be provided to generate Asset ID");
  }

  // If device already exists, return existing asset (prevent duplicate Asset ID generation)
  const existing = await findExistingByHardware(serial, mac);
  if (existing) {
    return { existing: true, asset: existing };
  }

  // Generate asset_id if not provided
  if (!payload.asset_id) {
    payload.asset_id = generateAssetId(serial, mac);
  }

  // Insert record
  const { query, parameters } = buildInsertQuery(payload);
  const result = await executeQuery(query, parameters);
  if (!result.recordset[0]) throw new ApiError(500, "Failed to insert asset");
  return { existing: false, asset: result.recordset[0] };
};

const editAsset = async (id, payload) => {
  // Prevent asset_id mutation
  if (payload.asset_id) delete payload.asset_id;

  // If serial_number or mac_address changed, ensure uniqueness (no other record uses them)
  if (payload.serial_number || payload.mac_address) {
    const check = await executeQuery(
      `SELECT TOP 1 * FROM inventory WHERE id <> @id AND ((serial_number IS NOT NULL AND serial_number = @serial) OR (mac_address IS NOT NULL AND mac_address = @mac))`,
      [
        { name: "id", type: sql.Int, value: Number(id) },
        { name: "serial", type: sql.NVarChar(200), value: payload.serial_number || null },
        { name: "mac", type: sql.NVarChar(50), value: payload.mac_address || null }
      ]
    );
    if (check.recordset.length) throw new ApiError(409, "serial_number or mac_address already bound to another asset");
  }

  const { query, parameters } = buildUpdateQuery(id, payload);
  const result = await executeQuery(query, parameters);
  if (!result.recordset[0]) throw new ApiError(404, "Inventory record not found");
  return result.recordset[0];
};

const listAssets = async () => {
  const result = await executeQuery("SELECT * FROM inventory ORDER BY created_at DESC");
  return result.recordset;
};

const getDropdownValues = async () => {
  const response = {};
  const dropdownFields = [
    "ministry", "department", "asset_category", "operating_system",
    "network_connection_type", "asset_current_status", "amc_warranty", "critical",
    "edr_installed", "uem_installed"
  ];

  for (const field of dropdownFields) {
    const result = await executeQuery(
      `SELECT value FROM (
          SELECT DISTINCT ${field} AS value FROM inventory WHERE ${field} IS NOT NULL AND ${field} <> ''
          UNION
          SELECT DISTINCT name AS value FROM lookup_values WHERE lookup_type = @field
        ) AS dropdown_values
        ORDER BY value`,
      [{ name: "field", type: sql.NVarChar(100), value: field }]
    );
    response[field] = result.recordset.map((r) => r.value);
  }

  for (const field of ["asset_user", "asset_custodian", "division"]) {
    const result = await executeQuery(
      `SELECT DISTINCT ${field} AS value FROM inventory WHERE ${field} IS NOT NULL AND ${field} <> '' ORDER BY ${field}`
    );
    response[field] = result.recordset.map((r) => r.value);
  }

  return response;
};

const searchUserInventory = async (q) => {
  const like = `%${q}%`;
  const result = await executeQuery(
    `SELECT TOP 25 * FROM inventory
     WHERE asset_user LIKE @q OR email LIKE @q OR phone LIKE @q
     ORDER BY updated_at DESC`,
    [{ name: "q", type: sql.NVarChar(255), value: like }]
  );
  return result.recordset;
};

module.exports = {
  addAsset,
  editAsset,
  listAssets,
  getDropdownValues,
  searchUserInventory
};
