const { executeQuery } = require("../config/db");
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
  const hash = crypto.createHash("sha256").update(source).digest("hex").slice(0, 8);
  return hash;
};

const findExistingByHardware = async (serial, mac) => {
  const result = await executeQuery(
    `SELECT * FROM inventory WHERE (serial_number IS NOT NULL AND serial_number = $1) OR (mac_address IS NOT NULL AND mac_address = $2)
     LIMIT 1`,
    [serial || null, mac || null]
  );
  return result.rows[0];
};

// Columns that are NOT NULL in the database and need defaults when absent from payload
const notNullDefaults = {
  block_name: "",
  floor: "",
  room: "",
  workstation: ""
};

const buildInsertQuery = (payload) => {
  // Ensure NOT NULL columns have defaults when missing
  const enrichedPayload = { ...payload };
  for (const [field, defaultValue] of Object.entries(notNullDefaults)) {
    if (!enrichedPayload.hasOwnProperty(field)) {
      enrichedPayload[field] = defaultValue;
    }
  }
  const fieldNames = allFields.filter((f) => enrichedPayload.hasOwnProperty(f));
  const placeholders = fieldNames.map((_, i) => `$${i + 1}`).join(", ");
  const columns = fieldNames.join(", ");
  const values = fieldNames.map((field) => {
    const val = enrichedPayload[field];
    return val === undefined ? null : val;
  });

  return {
    query: `INSERT INTO inventory (${columns}) VALUES (${placeholders}) RETURNING *`,
    parameters: values
  };
};

const buildUpdateQuery = (id, payload) => {
  // Prevent changing asset_id via update (immutable)
  const payloadSafe = { ...payload };
  delete payloadSafe.asset_id;
  const fieldNames = allFields.filter((f) => Object.prototype.hasOwnProperty.call(payloadSafe, f));

  if (fieldNames.length === 0) {
    throw new ApiError(400, "No valid fields to update");
  }

  const setClauses = fieldNames.map((f, i) => `${f} = $${i + 2}`).join(", ");

  const values = [
    Number(id),
    ...fieldNames.map((field) => {
      const val = payloadSafe[field];
      return val === undefined ? null : val;
    })
  ];

  return {
    query: `UPDATE inventory SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    parameters: values
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
  if (!result.rows[0]) throw new ApiError(500, "Failed to insert asset");
  return { existing: false, asset: result.rows[0] };
};

const editAsset = async (id, payload) => {
  const numericId = Number(id);
  if (isNaN(numericId)) throw new ApiError(400, "Invalid asset ID");

  // Prevent asset_id mutation
  if (payload.asset_id) delete payload.asset_id;

  // If serial_number or mac_address changed, ensure uniqueness (no other record uses them)
  if (payload.serial_number || payload.mac_address) {
    const check = await executeQuery(
      `SELECT * FROM inventory WHERE id <> $1 AND ((serial_number IS NOT NULL AND serial_number = $2) OR (mac_address IS NOT NULL AND mac_address = $3))
       LIMIT 1`,
      [numericId, payload.serial_number || null, payload.mac_address || null]
    );
    if (check.rows.length) throw new ApiError(409, "serial_number or mac_address already bound to another asset");
  }

  const { query, parameters } = buildUpdateQuery(numericId, payload);
  const result = await executeQuery(query, parameters);
  if (!result.rows[0]) throw new ApiError(404, "Inventory record not found");
  return result.rows[0];
};

const ALLOWED_INVENTORY_SORT_COLUMNS = [
  "id", "sr_no", "asset_id", "ministry", "department", "asset_category",
  "asset_description", "serial_number", "mac_address", "ip_address",
  "asset_user", "asset_custodian", "asset_current_status",
  "block_name", "floor", "room", "workstation",
  "purchase_date", "installation_date", "end_of_support_date", "end_of_life_date",
  "operating_system", "created_at", "updated_at"
];

const listAssets = async (pagination, filters = {}) => {
  const conditions = [];
  const params = [];

  const addCondition = (sqlClause, value) => {
    if (value === undefined || value === null || value === "") return;
    conditions.push(sqlClause);
    params.push(value);
  };

  // Search across multiple fields (if user provided a search term)
  if (filters.search && filters.search.trim()) {
    const searchTerm = `%${filters.search.trim()}%`;
    const searchFields = [
      "asset_user", "email", "phone", "department",
      "workstation", "asset_id", "asset_category",
      "asset_description", "serial_number", "block_name",
      "asset_custodian"
    ];
    const searchConditions = searchFields.map((f) => `${f} LIKE $1`).join(" OR ");
    addCondition(`(${searchConditions})`, searchTerm);
  }

  // Non-search filter conditions
  addCondition("ministry = $1", filters.ministry);
  addCondition("department = $1", filters.department);
  addCondition("asset_category = $1", filters.asset_category);
  addCondition("asset_current_status = $1", filters.asset_current_status);
  addCondition("edr_installed = $1", filters.edr_installed);
  addCondition("uem_installed = $1", filters.uem_installed);

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortBy =
    pagination.sortBy && ALLOWED_INVENTORY_SORT_COLUMNS.includes(pagination.sortBy)
      ? pagination.sortBy
      : "created_at";
  const orderClause = `ORDER BY ${sortBy} ${pagination.sortDirection || 'DESC'}`;

  // Separate count query for total
  const countQuery = `SELECT COUNT(*) AS total FROM inventory ${whereClause}`;
  const countResult = await executeQuery(countQuery, params);
  const total = parseInt(countResult.rows[0]?.total || 0, 10);

  const query = `
    SELECT * FROM inventory
    ${whereClause}
    ${orderClause}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const allParams = [...params, pagination.pageSize, pagination.offset];
  const result = await executeQuery(query, allParams);
  return { data: result.rows, total };
};

const getDropdownValues = async () => {
  const allFields = [
    "ministry", "department", "asset_category", "operating_system",
    "network_connection_type", "asset_current_status", "amc_warranty", "critical",
    "edr_installed", "uem_installed",
    "asset_user", "asset_custodian", "division"
  ];

  // Parallel batch: all inventory queries + all lookup queries in two rounds
  const grouped = {};
  for (const field of allFields) {
    const [fromInv, fromLookup] = await Promise.all([
      executeQuery(
        `SELECT ${field} AS v FROM inventory WHERE ${field} IS NOT NULL AND ${field} <> ''`,
        []
      ),
      executeQuery(
        `SELECT name AS v FROM lookup_values WHERE lookup_type = $1`,
        [field]
      ),
    ]);
    const combined = [...fromInv.rows, ...fromLookup.rows];
    const values = new Set();
    for (const row of combined) {
      const val = row.v;
      if (val !== null && val !== undefined && val !== "") {
        values.add(val);
      }
    }
    grouped[field] = [...values].sort();
  }

  return grouped;
};

const searchUserInventory = async (q) => {
  const like = `%${q}%`;
  const result = await executeQuery(
    `SELECT * FROM inventory
     WHERE asset_user LIKE $1 OR email LIKE $1 OR phone LIKE $1
     ORDER BY updated_at DESC
     LIMIT 25`,
    [like]
  );
  return result.rows;
};

const getAssetById = async (id) => {
  const numericId = Number(id);
  if (isNaN(numericId)) throw new ApiError(400, "Invalid asset ID");
  const result = await executeQuery(
    `SELECT * FROM inventory WHERE id = $1`,
    [numericId]
  );
  if (!result.rows[0]) throw new ApiError(404, "Inventory record not found");
  return result.rows[0];
};

const deleteAsset = async (id) => {
  const numericId = Number(id);
  if (isNaN(numericId)) throw new ApiError(400, "Invalid asset ID");
  const asset = await getAssetById(numericId);
  await executeQuery(
    `DELETE FROM inventory WHERE id = $1`,
    [numericId]
  );
  return asset;
};

const addDropdownValue = async (field, value) => {
  const allowedFields = [
    "ministry", "department", "asset_category", "operating_system",
    "network_connection_type"
  ];

  if (!allowedFields.includes(field)) {
    throw new ApiError(400, `Unsupported dropdown field: ${field}`);
  }

  const normalizedValue = String(value).trim();
  const normalizedCode = String(value)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "_")
    .slice(0, 50);

  const existing = await executeQuery(
    `SELECT id, name AS value, code FROM lookup_values WHERE lookup_type = $1 AND name = $2
     LIMIT 1`,
    [field, normalizedValue]
  );

  if (existing.rows.length) {
    return existing.rows[0];
  }

  const result = await executeQuery(
    `INSERT INTO lookup_values (lookup_type, name, code)
     VALUES ($1, $2, $3) RETURNING id, name AS value, code`,
    [field, normalizedValue, normalizedCode]
  );

  return result.rows[0];
};

module.exports = {
  addAsset,
  editAsset,
  deleteAsset,
  listAssets,
  getAssetById,
  getDropdownValues,
  searchUserInventory,
  addDropdownValue
};
