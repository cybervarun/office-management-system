const asyncHandler = require("../utils/asyncHandler");
const userService = require("../services/userService");
const { parsePagination, paginatedResponse } = require("../utils/pagination");

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
});

const listUsers = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { defaultSort: "created_at", defaultDirection: "DESC" });
  const filters = {
    search: req.query.search,
    role: req.query.role,
    is_active: req.query.is_active
  };
  const { data, total } = await userService.listUsers(pagination, filters);
  res.json(paginatedResponse(data, total, pagination));
});

const editRole = asyncHandler(async (req, res) => {
  const user = await userService.editRole(req.params.id, req.body.role);
  res.json(user);
});

const editUser = asyncHandler(async (req, res) => {
  const user = await userService.editUser(req.params.id, req.body);
  res.json(user);
});

const updatePassword = asyncHandler(async (req, res) => {
  const result = await userService.updatePassword(req.params.id, req.body.password);
  res.json(result);
});

const activate = asyncHandler(async (req, res) => {
  const user = await userService.setActive(req.params.id, true);
  res.json(user);
});

const deactivate = asyncHandler(async (req, res) => {
  const user = await userService.setActive(req.params.id, false);
  res.json(user);
});

const search = asyncHandler(async (req, res) => {
  const q = req.query.q || "";
  const users = await userService.searchUsers(q);
  res.json(users);
});

module.exports = {
  createUser,
  listUsers,
  editUser,
  editRole,
  updatePassword,
  activate,
  deactivate,
  search
};
