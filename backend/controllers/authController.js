const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/authService");

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body.email, req.body.password);
  res.json(data);
});

module.exports = {
  login
};
