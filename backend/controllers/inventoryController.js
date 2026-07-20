const asyncHandler = require("../utils/asyncHandler");
const inventoryService = require("../services/inventoryService");
const { executeQuery, sql } = require("../config/db");
const ApiError = require("../utils/ApiError");

const addAsset = asyncHandler(async (req, res) => {
  const result = await inventoryService.addAsset(req.body);
  if (result.existing) {
    return res.status(200).json({ message: "Asset already exists", asset: result.asset });
  }
  res.status(201).json(result.asset);
});

const editAsset = asyncHandler(async (req, res) => {
  const asset = await inventoryService.editAsset(req.params.id, req.body);
  res.json(asset);
});

const listAssets = asyncHandler(async (req, res) => {
  const assets = await inventoryService.listAssets();
  res.json(assets);
});

const dropdowns = asyncHandler(async (req, res) => {
  const values = await inventoryService.getDropdownValues();
  res.json(values);
});

const addDropdownValue = asyncHandler(async (req, res) => {
  const { field, value } = req.body;
  if (!field || !value) {
    throw new ApiError(400, "Both field and value are required");
  }

  const allowedFields = [
    "ministry",
    "department",
    "asset_category",
    "operating_system",
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
    `SELECT TOP 1 id, name AS value, code FROM lookup_values WHERE lookup_type = @field AND name = @value`,
    [
      { name: "field", type: sql.NVarChar(100), value: field },
      { name: "value", type: sql.NVarChar(255), value: normalizedValue }
    ]
  );

  if (existing.recordset.length) {
    return res.status(200).json(existing.recordset[0]);
  }

  const result = await executeQuery(
    `INSERT INTO lookup_values (lookup_type, name, code) OUTPUT INSERTED.id, INSERTED.name AS value, INSERTED.code VALUES (@field, @value, @code)`,
    [
      { name: "field", type: sql.NVarChar(100), value: field },
      { name: "value", type: sql.NVarChar(255), value: normalizedValue },
      { name: "code", type: sql.NVarChar(100), value: normalizedCode }
    ]
  );

  res.status(201).json(result.recordset[0]);
});

const userSearch = asyncHandler(async (req, res) => {
  const q = req.query.q || "";
  const result = await inventoryService.searchUserInventory(q);
  res.json(result);
});

module.exports = {
  addAsset,
  editAsset,
  listAssets,
  dropdowns,
  addDropdownValue,
  userSearch
};
