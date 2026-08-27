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
  const fieldNames = allFields.filter(f => enrichedPayload.hasOwnProperty(f));
  const placeholders = fieldNames.map(f => `@${f}`).join(", ");
  const columns = fieldNames.join(", ");

  const intFields = ["sr_no"];
  const parameters = fieldNames.map(field => {
    const isDate = dateFields.includes(field);
    const isInt = intFields.includes(field);
    return {
      name: field,
      type: isInt ? sql.Int : isDate ? sql.Date : sql.NVarChar(sql.MAX),
      value: enrichedPayload[field] === undefined ? null : (isInt ? Number(enrichedPayload[field]) : enrichedPayload[field])
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
    ...fieldNames.map(field => {
      const isInt = field === "sr_no";
      return {
        name: field,
        type: isInt ? sql.Int : dateFields.includes(field) ? sql.Date : sql.NVarChar(sql.MAX),
        value: payloadSafe[field] === undefined ? null : (isInt ? Number(payloadSafe[field]) : payloadSafe[field])
      };
    })
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
  let paramIndex = 0;

  // Build WHERE conditions from filters
  const addCondition = (sql, value, type) => {
    if (value === undefined || value === null || value === "") return;
    const paramName = `p${paramIndex++}`;
    conditions.push(sql.replace("@p", `@${paramName}`));
    params.push({ name: paramName, type, value });
  };

  addCondition("asset_user LIKE @p", filters.search ? `%${filters.search}%` : null, sql.NVarChar(255));
  addCondition("email LIKE @p", filters.search ? `%${filters.search}%` : null, sql.NVarChar(255));
  addCondition("phone LIKE @p", filters.search ? `%${filters.search}%` : null, sql.NVarChar(30));

  addCondition("ministry = @p", filters.ministry, sql.NVarChar(200));
  addCondition("department = @p", filters.department, sql.NVarChar(200));
  addCondition("asset_category = @p", filters.asset_category, sql.NVarChar(100));
  addCondition("asset_current_status = @p", filters.asset_current_status, sql.NVarChar(100));
  addCondition("edr_installed = @p", filters.edr_installed, sql.NVarChar(10));
  addCondition("uem_installed = @p", filters.uem_installed, sql.NVarChar(10));

  // Search across multiple fields (if user provided a search term)
  let searchClause = "";
  if (filters.search && filters.search.trim()) {
    const searchTerm = `%${filters.search.trim()}%`;
    // Combine multiple LIKE conditions with OR for search
    const searchFields = [
      "asset_user", "email", "phone", "department",
      "workstation", "asset_id", "asset_category",
      "asset_description", "serial_number", "block_name",
      "asset_custodian"
    ];
    const searchConditions = searchFields.map(f => `${f} LIKE @searchTerm`).join(" OR ");
    // Remove individual LIKE params we added for search, use combined OR instead
    // Keep only the first 3 params (search) and replace with combined OR
    // Actually, let's just clear and rebuild more cleanly
    conditions.length = 0;
    params.length = 0;
    paramIndex = 0;

    // Re-add non-search filters
    addCondition("ministry = @p", filters.ministry, sql.NVarChar(200));
    addCondition("department = @p", filters.department, sql.NVarChar(200));
    addCondition("asset_category = @p", filters.asset_category, sql.NVarChar(100));
    addCondition("asset_current_status = @p", filters.asset_current_status, sql.NVarChar(100));
    addCondition("edr_installed = @p", filters.edr_installed, sql.NVarChar(10));
    addCondition("uem_installed = @p", filters.uem_installed, sql.NVarChar(10));

    // Add search condition
    conditions.push(`(${searchConditions})`);
    params.push({ name: "searchTerm", type: sql.NVarChar(255), value: searchTerm });
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortBy = pagination.sortBy && ALLOWED_INVENTORY_SORT_COLUMNS.includes(pagination.sortBy)
    ? pagination.sortBy
    : "created_at";
  const orderClause = `ORDER BY ${sortBy} ${pagination.sortDirection}`;

  const query = `
    SELECT *, COUNT(*) OVER() AS _totalCount
    FROM inventory
    ${whereClause}
    ${orderClause}
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
  `;

  const allParams = [
    ...params,
    { name: "offset", type: sql.Int, value: pagination.offset },
    { name: "pageSize", type: sql.Int, value: pagination.pageSize }
  ];

  const result = await executeQuery(query, allParams);
  const records = result.recordset;
  const total = records.length > 0 ? records[0]._totalCount : 0;

  // Remove the _totalCount meta-field from each record before returning
  const data = records.map(({ _totalCount, ...rest }) => rest);
  return { data, total };
};

const getDropdownValues = async () => {
  const response = {};

  // Columns pulled from inventory + lookup_values (UNION deduplicates across sources)
  const compositeFields = [
    "ministry", "department", "asset_category", "operating_system",
    "network_connection_type", "asset_current_status", "amc_warranty", "critical",
    "edr_installed", "uem_installed"
  ];

  // Columns pulled from inventory only
  const simpleFields = ["asset_user", "asset_custodian", "division"];

  const parts = [];
  for (const field of compositeFields) {
    parts.push(`SELECT N'${field}' AS f, ${field} AS v FROM inventory WHERE ${field} IS NOT NULL AND ${field} <> ''`);
    parts.push(`SELECT N'${field}' AS f, name AS v FROM lookup_values WHERE lookup_type = N'${field}'`);
  }
  for (const field of simpleFields) {
    parts.push(`SELECT N'${field}' AS f, ${field} AS v FROM inventory WHERE ${field} IS NOT NULL AND ${field} <> ''`);
  }

  const rows = await executeQuery(parts.join(" UNION ALL "));
  const grouped = {};
  for (const row of rows.recordset) {
    const key = row.f;
    const val = row.v;
    if (!grouped[key]) grouped[key] = new Set();
    if (val !== null && val !== undefined && val !== "") grouped[key].add(val);
  }

  for (const key of Object.keys(grouped)) {
    response[key] = [...grouped[key]].sort();
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

const getAssetById = async (id) => {
  const result = await executeQuery(
    `SELECT * FROM inventory WHERE id = @id`,
    [{ name: "id", type: sql.Int, value: Number(id) }]
  );
  if (!result.recordset[0]) throw new ApiError(404, "Inventory record not found");
  return result.recordset[0];
};

const deleteAsset = async (id) => {
  const asset = await getAssetById(id);
  await executeQuery(
    `DELETE FROM inventory WHERE id = @id`,
    [{ name: "id", type: sql.Int, value: Number(id) }]
  );
  return asset;
};

module.exports = {
  addAsset,
  editAsset,
  deleteAsset,
  listAssets,
  getAssetById,
  getDropdownValues,
  searchUserInventory
};
