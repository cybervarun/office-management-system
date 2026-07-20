const asyncHandler = require("../utils/asyncHandler");
const userService = require("../services/userService");

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await userService.listUsers();
  res.json(users);
});

const editRole = asyncHandler(async (req, res) => {
  const user = await userService.editRole(req.params.id, req.body.role);
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
  editRole,
  updatePassword,
  activate,
  deactivate,
  search
};
