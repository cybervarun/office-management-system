require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { Pool, Client } = require("pg");

const getRequiredEnv = (...names) => {
  const value = names
    .map((n) => process.env[n])
    .find((item) => item && String(item).trim());
  if (!value || !String(value).trim()) {
    throw new Error(
      `${names.join(" or ")} is missing in .env`
    );
  }
  return String(value).trim();
};

const parsePort = (value) => {
  const port = Number.parseInt(value, 10);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("DB_PORT must be a valid TCP port number");
  }
  return port;
};

// Lazy pool — created on first use so that test stubs of executeQuery
// never trigger env-var validation at module-load time.
let _pool = null;
let _poolPromise = null;

const ensurePool = () => {
  if (_pool) return _pool;
  if (_poolPromise) return _poolPromise;
  _poolPromise = (async () => {
    const host = getRequiredEnv("DB_HOST");
    const port = parsePort(process.env.DB_PORT || "5432");
    const database = getRequiredEnv("DB_NAME");
    const user = getRequiredEnv("DB_USER");
    const password = getRequiredEnv("DB_PASSWORD");
    if (!password) {
      throw new Error(
        "Database password must be set via DB_PASSWORD environment variable"
      );
    }
    const p = new Pool({
      host,
      port,
      database,
      user,
      password,
      max: Number(process.env.DB_POOL_MAX || "20"),
      idleTimeoutMillis: Number(process.env.DB_POOL_TIMEOUT || "10000"),
      connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT || "5000"),
    });
    p.on("error", (err) => {
      console.error("Unexpected pg pool error:", err);
    });
    _pool = p;
    return p;
  })();
  return _poolPromise;
};

const logConnectionTarget = () => {
  const host = process.env.DB_HOST || "unknown";
  const port = process.env.DB_PORT || "5432";
  const database = process.env.DB_NAME || "unknown";
  const user = process.env.DB_USER || "unknown";
  console.log(
    `Connecting to PostgreSQL ${host}:${port}, database ${database}, user ${user}`
  );
};

/**
 * Execute a parameterized query using a pooled connection.
 * @param {string} text - SQL text with $1, $2, ... placeholders
 * @param {unknown[]} values - Array of parameter values
 * @returns {Promise<pg.QueryResult>}
 */
const executeQuery = async (text, values = []) => {
  const pool = await ensurePool();
  const client = await pool.connect();
  try {
    return await client.query(text, values);
  } finally {
    client.release();
  }
};

/**
 * Execute a query inside an explicit transaction.
 * The callback receives a client that must be committed or rolled back.
 * @param {(client: import('pg').Client) => Promise<unknown>} fn
 * @returns {Promise<unknown>}
 */
const executeTransaction = async (fn) => {
  const pool = await ensurePool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Get the raw pool instance (caller is responsible for pool lifecycle).
 */
const getPool = async () => ensurePool();

/**
 * poolConnect — resolves when the pool is created AND a test query succeeds.
 * app.js awaits this before starting the HTTP server.
 * Rejects with a descriptive error if the database is unreachable.
 */
const poolConnect = ensurePool().then(async (pool) => {
  await pool.query("SELECT 1 AS connect_test");
  return pool;
});

module.exports = {
  get pool() { return _pool; },
  poolConnect,
  getPool,
  executeQuery,
  executeTransaction,
  logConnectionTarget,
};
