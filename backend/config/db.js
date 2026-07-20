const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const sql = require("mssql");

const getRequiredEnv = (...names) => {
  const value = names.map((name) => process.env[name]).find((item) => item && String(item).trim());
  if (!value || !String(value).trim()) {
    throw new Error(`${names.join(" or ")} is missing in .env`);
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

const config = {
  user: process.env.DB_USER || process.env.SA_USER || "sa",
  password: process.env.DB_PASS || process.env.SA_PASSWORD || process.env.MSSQL_SA_PASSWORD,
  server: process.env.DB_SERVER || "127.0.0.1",
  database: process.env.DB_NAME || process.env.MSSQL_DB || "OfficeManagement",
  port: parsePort(process.env.DB_PORT || "1433"),
  options: {
    encrypt: String(process.env.DB_ENCRYPT || "false").toLowerCase() === "true",
    trustServerCertificate: String(process.env.DB_TRUST_CERT || "true").toLowerCase() === "true"
  },
  pool: {
    max: Number(process.env.DB_POOL_MAX || "10"),
    min: Number(process.env.DB_POOL_MIN || "0"),
    idleTimeoutMillis: Number(process.env.DB_POOL_TIMEOUT || "30000")
  }
};

if (!config.password) {
  throw new Error("Database password must be set via DB_PASS, SA_PASSWORD, or MSSQL_SA_PASSWORD environment variable");
}

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

pool.on("error", (err) => {
  console.error("SQL Server pool error:", err);
});

const logConnectionTarget = () => {
  console.log(
    `Connecting to SQL Server ${config.server}:${config.port}, database ${config.database}, user ${config.user}`
  );
};

const executeQuery = async (query, params = []) => {
  await poolConnect;
  const request = pool.request();
  params.forEach((p) => request.input(p.name, p.type, p.value));
  return request.query(query);
};

const getPool = async () => {
  await poolConnect;
  return pool;
};

module.exports = {
  sql,
  pool,
  poolConnect,
  logConnectionTarget,
  executeQuery,
  getPool
};
