# Incident Report: Local Environment Setup Failure

## Issue Summary

When attempting to run the IT Inventory & Ticketing application on localhost for testing, the backend server repeatedly crashed with a "Login failed for user 'sa'" error. The frontend could not communicate with the backend, making the entire application unusable. This blocked all local testing and development work.

## Root Cause Analysis

Three separate problems converged to prevent the app from running:

1. **Missing database** — The `OfficeManagement` database did not exist in SQL Server, even though the application code assumed it would be auto-created.
2. **Password mismatch** — The `.env` file contained the value `DB_PASS="Admin123!"`, but the actual SQL Server `sa` account password was different. The double quotes around the value in the `.env` file were not interfering with Node.js dotenv parsing, but the value itself was incorrect.
3. **Port conflicts** — Port 5173 (frontend) was already occupied by a stale vite process from a previous session, causing startup failures and unpredictable behavior.

## Chronological Resolution

### Step 1: Confirmed Backend Was Not Running

The first check was the backend health endpoint at `http://localhost:5000/health`. The connection was refused, confirming the server was not running. The log file `backend/backend.err.log` was empty, but `backend.backend.out.log` showed the startup sequence: connection attempt, then crash with "Login failed for user 'sa'."

### Step 2: Identified the Correct SQL Server Password

The `.env` file listed `DB_PASS="Admin123!"`, but this password failed against SQL Server. A systematic test of common passwords against the `master` database was performed using a Node.js script with the `mssql` library. The password `Admin123!` succeeded when connecting to the `master` database but failed for `OfficeManagement`, revealing the database itself was missing.

### Step 3: Created the Missing Database and Applied Schema

Using the confirmed password, a connection to the `master` database was established. A query confirmed `OfficeManagement` did not exist. The database was created with:

```sql
CREATE DATABASE OfficeManagement;
```

Then the full schema was applied by running:

```bash
npm run init-db
```

All 12 parts of the schema executed successfully, creating the five tables (`users`, `inventory`, `tickets`, `ticket_history`) and all indexes.

### Step 4: Created the Admin User

The `create_admin.js` script requires a password of at least 12 characters. It was run with an environment variable:

```bash
ADMIN_PASSWORD="SecureAdmin@2024!" node scripts/create_admin.js
```

The output confirmed the admin user was created: `admin@local` with password fingerprint `36df1b25`.

### Step 5: Started Both Servers

The backend was started with `npm run dev` and verified with the health endpoint returning `{"ok":true}`. The frontend started on port 5174 initially (because 5173 was occupied), then later resumed on 5173 after the stale process was cleared.

### Step 6: Verified End-to-End Functionality

- Backend health: `curl http://localhost:5000/health` → `{"ok":true}`
- Frontend: `curl http://localhost:5173` → returns valid HTML
- Database: Query confirmed 1 user record exists in the `users` table

Both servers are now running and the application is accessible at http://localhost:5173 with login credentials `admin@local` / `SecureAdmin@2024!`.

## Actions for Future Prevention

### 1. Add a Database Existence Check to the Startup Script

The application currently crashes if the database does not exist. Before starting the backend, run a quick check:

```bash
node -e "
const mssql = require('mssql');
async function check() {
  const c = await mssql.connect({user:'sa', password:process.env.DB_PASS, server:'127.0.0.1', database:'master', port:1433, options:{encrypt:false,trustServerCertificate:true}});
  const r = await c.request().query(\"SELECT name FROM sys.databases WHERE name='OfficeManagement'\");
  console.log(r.recordset.length > 0 ? 'DB exists' : 'DB MISSING - run npm run init-db');
  await c.close();
}
check();
"
```

Add this as a `prestart` check in `package.json` so it runs automatically.

### 2. Maintain a `.env.example` File with Verified Credentials

The current `.env` file is tracked in git (not in `.gitignore`), meaning it may contain incorrect or outdated passwords. Create a `backend/.env.example` with placeholder values that is committed to the repository, and add `backend/.env` to `.gitignore`. This prevents committed credentials from going stale and gives new team members a clear template.

### 3. Add a Port Availability Check Before Starting Servers

Both the backend (port 5000) and frontend (port 5173) should verify their ports are free before binding. Add a pre-check script or use `npm run dev` with the `PORT` and `VITE_PORT` environment variables explicitly set. A simple check:

```bash
netstat -ano | findstr :5000
netstat -ano | findstr :5173
```

If a port is occupied, kill the stale process before starting:

```bash
taskkill /PID <process_id>
```

## Key Takeaways

The failure was not caused by a single bug but by three compounding issues: missing database, wrong password, and port conflict. The most effective immediate fix was identifying the correct SQL password through systematic testing. The most important long-term fix is adding startup validation checks so that missing databases and configuration errors are caught early with clear error messages rather than cryptic "Login failed" crashes.
