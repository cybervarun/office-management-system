const asyncHandler = require("../utils/asyncHandler");
const inventoryService = require("../services/inventoryService");
const ApiError = require("../utils/ApiError");
const { parsePagination, paginatedResponse } = require("../utils/pagination");

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

const getAsset = asyncHandler(async (req, res) => {
  const asset = await inventoryService.getAssetById(req.params.id);
  res.json(asset);
});

const deleteAsset = asyncHandler(async (req, res) => {
  const asset = await inventoryService.deleteAsset(req.params.id);
  res.json({ message: "Asset deleted", asset });
});

const listAssets = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { defaultSort: "created_at", defaultDirection: "DESC" });
  const filters = {
    search: req.query.search,
    ministry: req.query.ministry,
    department: req.query.department,
    asset_category: req.query.asset_category,
    asset_current_status: req.query.asset_current_status,
    edr_installed: req.query.edr_installed,
    uem_installed: req.query.uem_installed
  };
  const { data, total } = await inventoryService.listAssets(pagination, filters);
  res.json(paginatedResponse(data, total, pagination));
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

  const result = await inventoryService.addDropdownValue(field, value);
  res.status(200).json(result);
});

const userSearch = asyncHandler(async (req, res) => {
  const q = req.query.q || "";
  const result = await inventoryService.searchUserInventory(q);
  res.json(result);
});

module.exports = {
  addAsset,
  getAsset,
  editAsset,
  deleteAsset,
  listAssets,
  dropdowns,
  addDropdownValue,
  userSearch
};
