const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { executeQuery, sql } = require("../config/db");
const ApiError = require("../utils/ApiError");

const login = async (email, password) => {
  const result = await executeQuery(
    "SELECT id, name, email, role, password_hash, is_active FROM users WHERE email = @email",
    [{ name: "email", type: sql.NVarChar(255), value: email }]
  );
  const user = result.recordset[0];
  if (!user) throw new ApiError(401, "Invalid credentials");
  if (!user.is_active) throw new ApiError(403, "User is inactive");

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new ApiError(401, "Invalid credentials");

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  };
};

module.exports = {
  login
};
