const bcrypt = require("bcryptjs");
const { executeQuery } = require("../config/db");
const ApiError = require("../utils/ApiError");

const createUser = async (payload) => {
  const hash = await bcrypt.hash(payload.password, 10);
  const result = await executeQuery(
    `INSERT INTO users (name, email, phone, role, password_hash, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, phone, role, is_active`,
    [payload.name, payload.email, payload.phone || null, payload.role, hash, true]
  );
  return result.rows[0];
};

const editRole = async (id, role) => {
  const result = await executeQuery(
    `UPDATE users SET role = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, name, email, phone, role, is_active`,
    [role, Number(id)]
  );
  if (!result.rows[0]) throw new ApiError(404, "User not found");
  return result.rows[0];
};

const updatePassword = async (id, password) => {
  const hash = await bcrypt.hash(password, 10);
  const result = await executeQuery(
    "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
    [hash, Number(id)]
  );
  if (result.rowCount === 0) throw new ApiError(404, "User not found");
  return { message: "Password updated" };
};

const editUser = async (id, payload) => {
  const fields = [];
  const params = [];
  let paramIndex = 1;

  if (payload.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    params.push(payload.name);
  }
  if (payload.email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    params.push(payload.email);
  }
  if (payload.phone !== undefined) {
    fields.push(`phone = $${paramIndex++}`);
    params.push(payload.phone || null);
  }
  if (payload.role !== undefined) {
    fields.push(`role = $${paramIndex++}`);
    params.push(payload.role);
  }
  if (fields.length === 0) throw new ApiError(400, "No fields to update");

  fields.push(`updated_at = NOW()`);
  params.push(Number(id));

  const result = await executeQuery(
    `UPDATE users SET ${fields.join(", ")}
     WHERE id = $${paramIndex}
     RETURNING id, name, email, phone, role, is_active`,
    params
  );
  if (!result.rows[0]) throw new ApiError(404, "User not found");
  return result.rows[0];
};

const setActive = async (id, active) => {
  const result = await executeQuery(
    `UPDATE users SET is_active = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, name, email, phone, role, is_active`,
    [!!active, Number(id)]
  );
  if (!result.rows[0]) throw new ApiError(404, "User not found");
  return result.rows[0];
};

const searchUsers = async (q) => {
  const like = `%${q}%`;
  const result = await executeQuery(
    `SELECT id, name, email, phone, role, is_active
     FROM users
     WHERE name LIKE $1 OR email LIKE $1 OR phone LIKE $1
     ORDER BY name
     LIMIT 25`,
    [like]
  );
  return result.rows;
};

const ALLOWED_USER_SORT_COLUMNS = [
  "id", "name", "email", "phone", "role", "is_active", "created_at", "updated_at"
];

const listUsers = async (pagination, filters = {}) => {
  const conditions = [];
  const params = [];

  if (filters.role) {
    conditions.push("role = $1");
    params.push(filters.role);
  }
  if (filters.is_active !== undefined && filters.is_active !== "") {
    conditions.push("is_active = $1");
    params.push(Number(filters.is_active));
  }
  if (filters.search && filters.search.trim()) {
    const searchTerm = `%${filters.search.trim()}%`;
    const searchFields = ["name", "email", "phone"];
    const searchClause = searchFields.map((f) => `${f} LIKE $${params.length + 1}`).join(" OR ");
    conditions.push(`(${searchClause})`);
    params.push(searchTerm);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sortBy =
    pagination.sortBy && ALLOWED_USER_SORT_COLUMNS.includes(pagination.sortBy)
      ? pagination.sortBy
      : "created_at";

  const orderClause = `ORDER BY ${sortBy} ${pagination.sortDirection || 'DESC'}`;

  // Separate count query for total
  const countQuery = `SELECT COUNT(*) AS total FROM users ${whereClause}`;
  const countResult = await executeQuery(countQuery, params);
  const total = parseInt(countResult.rows[0]?.total || 0, 10);

  const query = `
    SELECT id, name, email, phone, role, is_active, created_at, updated_at
    FROM users
    ${whereClause}
    ${orderClause}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const allParams = [
    ...params,
    pagination.pageSize,
    pagination.offset
  ];

  const result = await executeQuery(query, allParams);
  return { data: result.rows, total };
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
