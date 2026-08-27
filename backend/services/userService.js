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

const editUser = async (id, payload) => {
  const fields = [];
  const params = [];
  if (payload.name !== undefined) { fields.push("name = @name"); params.push({ name: "name", type: sql.NVarChar(255), value: payload.name }); }
  if (payload.email !== undefined) { fields.push("email = @email"); params.push({ name: "email", type: sql.NVarChar(255), value: payload.email }); }
  if (payload.phone !== undefined) { fields.push("phone = @phone"); params.push({ name: "phone", type: sql.NVarChar(30), value: payload.phone || null }); }
  if (payload.role !== undefined) { fields.push("role = @role"); params.push({ name: "role", type: sql.NVarChar(50), value: payload.role }); }
  if (fields.length === 0) throw new ApiError(400, "No fields to update");
  fields.push("updated_at = SYSUTCDATETIME()");
  params.push({ name: "id", type: sql.Int, value: Number(id) });
  const result = await executeQuery(
    `UPDATE users SET ${fields.join(", ")}
     OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.phone, INSERTED.role, INSERTED.is_active
     WHERE id = @id`,
    params
  );
  if (!result.recordset[0]) throw new ApiError(404, "User not found");
  return result.recordset[0];
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

const ALLOWED_USER_SORT_COLUMNS = [
  "id", "name", "email", "phone", "role", "is_active", "created_at", "updated_at"
];

const listUsers = async (pagination, filters = {}) => {
  const conditions = [];
  const params = [];

  if (filters.role) {
    conditions.push("role = @role");
    params.push({ name: "role", type: sql.NVarChar(50), value: filters.role });
  }
  if (filters.is_active !== undefined && filters.is_active !== "") {
    conditions.push("is_active = @is_active");
    params.push({ name: "is_active", type: sql.Bit, value: Number(filters.is_active) });
  }
  if (filters.search && filters.search.trim()) {
    const searchTerm = `%${filters.search.trim()}%`;
    const searchFields = ["name", "email", "phone"];
    const searchClause = searchFields.map(f => `${f} LIKE @searchTerm`).join(" OR ");
    conditions.push(`(${searchClause})`);
    params.push({ name: "searchTerm", type: sql.NVarChar(255), value: searchTerm });
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sortBy = pagination.sortBy && ALLOWED_USER_SORT_COLUMNS.includes(pagination.sortBy)
    ? pagination.sortBy
    : "created_at";

  const orderClause = `ORDER BY ${sortBy} ${pagination.sortDirection}`;

  const query = `
    SELECT id, name, email, phone, role, is_active, created_at, updated_at,
           COUNT(*) OVER() AS _totalCount
    FROM users
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
  const data = records.map(({ _totalCount, ...rest }) => rest);
  return { data, total };
};

module.exports = {
  createUser,
  editUser,
  editRole,
  updatePassword,
  setActive,
  searchUsers,
  listUsers
};
