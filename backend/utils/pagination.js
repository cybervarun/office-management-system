/**
 * Pagination utility for server-side pagination, sorting, and filtering.
 *
 * Parses raw query params into a structured pagination object,
 * generates OFFSET/FETCH clauses, and provides a response envelope.
 */

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Parse and validate pagination parameters from query string values.
 *
 * @param {object} query - req.query object
 * @param {object} config - { defaultSort?: string, defaultDirection?: string, maxPageSize?: number }
 * @returns {{ page: number, pageSize: number, offset: number, sortBy: string, sortDirection: string }}
 */
const parsePagination = (query, config = {}) => {
  const {
    defaultSort = "created_at",
    defaultDirection = "DESC",
    maxPageSize = MAX_PAGE_SIZE
  } = config;

  const rawPage = Number(query.page);
  const rawPageSize = Number(query.pageSize);

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  let pageSize = Number.isInteger(rawPageSize) && rawPageSize > 0 ? rawPageSize : DEFAULT_PAGE_SIZE;

  if (pageSize > maxPageSize) {
    pageSize = maxPageSize;
  }

  const offset = (page - 1) * pageSize;

  const sortBy = query.sortBy && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(String(query.sortBy))
    ? String(query.sortBy)
    : defaultSort;

  const sortDirection = query.sortDirection && String(query.sortDirection).toUpperCase() === "ASC"
    ? "ASC"
    : defaultDirection === "ASC" ? "ASC" : "DESC";

  return { page, pageSize, offset, sortBy, sortDirection };
};

/**
 * Validate that a sortBy column name is in an allowed list to prevent SQL injection.
 *
 * @param {string} sortBy
 * @param {string[]} allowedColumns
 * @param {string} defaultColumn
 * @returns {string}
 */
const validateSortBy = (sortBy, allowedColumns, defaultColumn) => {
  if (allowedColumns.includes(sortBy)) return sortBy;
  return defaultColumn;
};

/**
 * Build a paginated response envelope.
 *
 * @param {Array} data - the page of records
 * @param {number} total - total matching record count (from COUNT(*) OVER())
 * @param {object} pagination - { page, pageSize } from parsePagination()
 * @returns {{ data: Array, pagination: { page: number, pageSize: number, total: number, totalPages: number } }}
 */
const paginatedResponse = (data, total, pagination) => {
  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
  return {
    data: data || [],
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      totalPages
    }
  };
};

module.exports = {
  parsePagination,
  validateSortBy,
  paginatedResponse,
  MAX_PAGE_SIZE,
  DEFAULT_PAGE_SIZE
};
