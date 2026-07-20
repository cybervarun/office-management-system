const bcrypt = require("bcryptjs");
const { executeQuery, sql } = require("../config/db");
const ApiError = require("../utils/ApiError");

const createUser = async (payload) => {
  const hash = await bcrypt.hash(payload.password, 10);
  const result = await executeQuery(
    `INSERT INTO users (name, email, phone, role, password_hash, is_active)
     OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.phone, INSERTED.role, INSERTED.is_active
     VALUES (@name, @email, @phone, @role, @password_hash, 1)`,
    [
      { name: "name", type: sql.NVarChar(255), value: payload.name },
      { name: "email", type: sql.NVarChar(255), value: payload.email },
      { name: "phone", type: sql.NVarChar(30), value: payload.phone || null },
      { name: "role", type: sql.NVarChar(50), value: payload.role },
      { name: "password_hash", type: sql.NVarChar(255), value: hash }
    ]
  );
  return result.recordset[0];
};

const editRole = async (id, role) => {
  const result = await executeQuery(
    `UPDATE users SET role = @role, updated_at = SYSUTCDATETIME()
     OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.phone, INSERTED.role, INSERTED.is_active
     WHERE id = @id`,
    [
      { name: "id", type: sql.Int, value: Number(id) },
      { name: "role", type: sql.NVarChar(50), value: role }
    ]
  );
  if (!result.recordset[0]) throw new ApiError(404, "User not found");
  return result.recordset[0];
};

const updatePassword = async (id, password) => {
  const hash = await bcrypt.hash(password, 10);
  const result = await executeQuery(
    "UPDATE users SET password_hash = @password_hash, updated_at = SYSUTCDATETIME() WHERE id = @id",
    [
      { name: "id", type: sql.Int, value: Number(id) },
      { name: "password_hash", type: sql.NVarChar(255), value: hash }
    ]
  );
  if (!result.rowsAffected[0]) throw new ApiError(404, "User not found");
  return { message: "Password updated" };
};

const setActive = async (id, active) => {
  const result = await executeQuery(
    `UPDATE users SET is_active = @active, updated_at = SYSUTCDATETIME()
     OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.phone, INSERTED.role, INSERTED.is_active
     WHERE id = @id`,
    [
      { name: "id", type: sql.Int, value: Number(id) },
      { name: "active", type: sql.Bit, value: active ? 1 : 0 }
    ]
  );
  if (!result.recordset[0]) throw new ApiError(404, "User not found");
  return result.recordset[0];
};

const searchUsers = async (q) => {
  const like = `%${q}%`;
  const result = await executeQuery(
    `SELECT TOP 25 id, name, email, phone, role, is_active
     FROM users
     WHERE name LIKE @q OR email LIKE @q OR phone LIKE @q
     ORDER BY name`,
    [{ name: "q", type: sql.NVarChar(255), value: like }]
  );
  return result.recordset;
};

const listUsers = async () => {
  const result = await executeQuery(
    "SELECT id, name, email, phone, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC"
  );
  return result.recordset;
};

module.exports = {
  createUser,
  editRole,
  updatePassword,
  setActive,
  searchUsers,
  listUsers
};
