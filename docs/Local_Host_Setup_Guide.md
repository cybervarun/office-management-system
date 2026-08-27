# Running the IT Inventory & Ticketing App on Localhost

A step-by-step guide to setting up and running the IT Inventory & Ticketing system on your local machine for testing and development.

---

## Table of Contents

1. [What You Need Before You Start](#1-what-you-need-before-you-start)
2. [Install Prerequisites](#2-install-prerequisites)
3. [Get the Project Files](#3-get-the-project-files)
4. [Set Up the Database](#4-set-up-the-database)
5. [Configure the Backend](#5-configure-the-backend)
6. [Start the Backend Server](#6-start-the-backend-server)
7. [Configure and Start the Frontend](#7-configure-and-start-the-frontend)
8. [Create Your First Admin Account](#8-create-your-first-admin-account)
9. [Verify Everything Works](#9-verify-everything-works)
10. [Common Problems and Fixes](#10-common-problems-and-fixes)
11. [Tips for Day-to-Day Development](#11-tips-for-day-to-day-development)

---

## 1. What You Need Before You Start

This project has two parts — a backend (server) and a frontend (user interface). Both need to run at the same time for the app to work.

**Assumptions about your machine:**
- You are running Windows 10 or 11.
- You have an internet connection for installing packages.
- You have at least 4 GB of free disk space.

**Software you will install:**
| Software | Purpose | Minimum Version |
|----------|---------|-----------------|
| [Node.js](https://nodejs.org/) | Runs the backend and frontend servers | 18.x or later |
| [PostgreSQL](https://www.postgresql.org/download/windows/) | Stores all application data | 14 or later |
| [Git](https://git-scm.com/) | Downloads the project files | Any recent version |

**Optional but helpful:**
- [pgAdmin](https://www.pgadmin.org/) — visual database management for PostgreSQL
- [Postman](https://www.postman.com/) — for testing API endpoints
- A code editor like [Visual Studio Code](https://code.visualstudio.com/)

---

## 2. Install Prerequisites

### Install Node.js

1. Go to [nodejs.org](https://nodejs.org/).
2. Download the **LTS** (Long Term Support) version.
3. Run the installer. Accept all defaults.
4. Verify installation by opening a terminal (Command Prompt or PowerShell) and typing:

```bash
node --version
```

You should see a version number like `v18.x.x` or higher. Also verify npm:

```bash
npm --version
```

### Install PostgreSQL

1. Go to [PostgreSQL Downloads](https://www.postgresql.org/download/windows/).
2. Download the latest installer (PostgreSQL 14+ recommended).
3. Run the installer. Accept the default location (`C:\Program Files\PostgreSQL\<version>`).
4. When prompted for a password, set a strong password for the `postgres` superuser — you will need this password later.
5. Keep the default port (`5432`) unless you have a conflict.
6. Accept the default locale (`English_India`) or choose your preferred locale.
7. Complete the installation. PostgreSQL will be registered as a Windows service and start automatically.

### Install Git

1. Go to [git-scm.com](https://git-scm.com/).
2. Download and install with default settings.

---

## 3. Get the Project Files

Open a terminal and run:

```bash
git clone https://github.com/cybervarun/office-management-system-government-node.git
cd office-management-system-government-node
```

Install dependencies for both the backend and frontend:

```bash
cd backend
npm install
cd ../frontend
npm install
cd ..
```

---

## 4. Set Up the Database

The app needs a PostgreSQL database to store users, inventory items, and tickets. The project includes a schema DDL file that creates everything automatically.

### Step 4a: Create the Database

First, create the `office_management` database. Open a terminal and run:

```bash
cd backend
createdb -U postgres -h localhost office_management
```

Alternatively, connect via psql and create it interactively:

```bash
psql -U postgres -h localhost
# At the psql prompt:
CREATE DATABASE office_management;
\q
```

> **Note:** Replace `postgres` with the superuser name you set during PostgreSQL installation. If you set a password, you may need to set the `PGPASSWORD` environment variable: `set PGPASSWORD=yourpassword` (Windows) or `export PGPASSWORD=yourpassword` (Linux/Mac).

### Step 4b: Apply the Schema

Run the migration script to create all tables, constraints, indexes, and seed data:

```bash
cd backend
node scripts/migrate_to_postgres.js
```

This reads `docs/PostgreSQL_Schema_DDL.sql` and applies it in a transaction. You should see:
```
Schema DDL executed successfully.
Transaction committed.
...
Migration completed successfully!
```

**Verify the tables were created:**

```bash
psql -U postgres -h localhost -d office_management -c "\dt"
```

You should see: `users`, `inventory`, `tickets`, `ticket_history`, `lookup_values`.

### Database Scripts Reference

| Script | Purpose |
|--------|---------|
| `npm run migrate-pg` | Apply the full PostgreSQL schema (tables, indexes, constraints, seed data) |
| `npm run rollback-pg` | Drop all application tables (WARNING: deletes all data) |
| `npm run test-db` | Test database connectivity and PostgreSQL features |
| `npm run seed-admin` | Create/update the admin user account |

---

## 5. Configure the Backend

The backend reads its settings from a `.env` file. Create one now.

1. Navigate to the `backend` folder.
2. Create a file named `.env` with this content:

```ini
# Database connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=office_management
DB_USER=postgres
DB_PASSWORD=your-postgres-password

# Connection pool (optional — defaults shown)
DB_POOL_MAX=20
DB_POOL_TIMEOUT=10000
DB_CONNECTION_TIMEOUT=5000

# JWT secret (change this to any random string for local testing)
JWT_SECRET=local-dev-secret-key-change-in-production

# Server port
PORT=5000

# CORS origin (frontend URL)
CORS_ORIGIN=http://localhost:5173
```

**Important:** Replace `your-postgres-password` with the actual password you set during PostgreSQL installation. If you are using trust authentication (e.g., local development), you can set the password to an empty string but note the app requires a password value, so setting a password is recommended.

---

## 6. Start the Backend Server

From the `backend` folder:

```bash
npm run dev
```

You should see output like:
```
Connecting to PostgreSQL localhost:5432, database office_management, user postgres
DB Connected
Server running on port 5000
```

**If you see `DB Connection Failed`**, check:
- PostgreSQL is running (open Services and look for "postgresql-x64-18" or similar).
- The password in `.env` matches your PostgreSQL password.
- Port 5432 is not blocked by a firewall.
- The database `office_management` exists: run `psql -U postgres -h localhost -l` to list databases.

Leave this terminal open — the server must keep running.

---

## 7. Configure and Start the Frontend

Open a **second** terminal window (the backend is still running in the first one).

1. Navigate to the `frontend` folder:

```bash
cd frontend
```

2. The frontend connects to the backend at `http://localhost:5000` by default. This matches our backend setup, so no changes are needed.

3. Start the development server:

```bash
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

4. Open **http://localhost:5173** in your web browser.

---

## 8. Create Your First Admin Account

The app requires at least one admin user to log in. Create one from the `backend` folder:

```bash
npm run seed-admin
```

This creates a default admin account:
- **Email:** `admin@local`
- **Password:** `SecureAdmin@2024!` (or a one-time password if using `--reset`)

You will use these credentials to log in through the browser.

---

## 9. Verify Everything Works

1. Open **http://localhost:5173** in your browser.
2. Log in with `admin@local` / `SecureAdmin@2024!`.
3. You should see the **Dashboard** page.
4. Try navigating to different sections:
   - **Inventory** — add an item to confirm database writes work.
   - **Users** — create a test user.
   - **Tickets** — raise a test ticket.
5. Check the backend health endpoint: open **http://localhost:5000/health** in a new browser tab. You should see:

```json
{"ok": true}
```

If all of this works, your local environment is fully functional.

---

## 10. Common Problems and Fixes

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| `DB_PASSWORD is missing in .env` | The `.env` file is missing or empty | Create the `.env` file in the `backend` folder (see Step 5) |
| `DB Connection Failed` | PostgreSQL is not running or wrong credentials | Open Windows Services, find "postgresql-x64-18", and check it is running. Verify `DB_PASSWORD` in `.env` matches your PostgreSQL password. |
| `password authentication failed for user "postgres"` | Wrong password in `.env` | Update `DB_PASSWORD` in `backend/.env` with the correct PostgreSQL password. Reset it with: `psql -U postgres -c "ALTER USER postgres PASSWORD 'newpassword';"` |
| `DB_HOST is missing` or `DB_NAME is missing` | `.env` file not found or misconfigured | Ensure `.env` is in the `backend/` directory and contains all required DB_* variables |
| `EACCES: permission denied` on port 5000 | Another process is using port 5000 | Change `PORT=5000` to another value (e.g., `PORT=5001`) in `backend/.env` and update `frontend/src/services/api.js` accordingly |
| Frontend shows a blank page or network error | Backend is not running | Make sure the backend terminal is still running (`npm run dev` in `backend/`) |
| `Cannot find module` errors after `npm install` | Dependencies not fully installed | Delete `node_modules` and `package-lock.json` in the failing folder, then run `npm install` again |
| Browser says "Not authorized" or redirects to login | JWT token expired or invalid | Log out and log back in; tokens expire after a period of inactivity |
| Port 5432 already in use | Another PostgreSQL instance is running | Check with `netstat -an | findstr 5432` and stop conflicting services, or change `DB_PORT` in `.env` |
| Port 5173 already in use | Another Vite instance is running | Close the other instance, or stop it with `Ctrl+C`, then re-run `npm run dev` |

---

## 11. Tips for Day-to-Day Development

- **Restart the backend after code changes.** Since we use `nodemon` (via `npm run dev`), backend files auto-reload. If you edit `app.js` or config files, nodemon restarts automatically.

- **Frontend also auto-reloads.** Vite's dev server watches for file changes and refreshes the browser instantly.

- **Keep both terminals visible.** One for the backend, one for the frontend. Errors appear in the terminal of whichever part failed.

- **Do not edit files in `frontend/dist`.** This folder is generated by `npm run build`. Always edit source files in `frontend/src/`.

- **Database changes require re-running the migration.** If you modify `docs/PostgreSQL_Schema_DDL.sql`, first rollback with `npm run rollback-pg` (WARNING: deletes all data), then re-run `npm run migrate-pg`.

- **Use a `.env` example for your team.** Create a `backend/.env.example` file with placeholder values (no real passwords) so new team members know what to fill in:

  ```ini
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=office_management
  DB_USER=postgres
  DB_PASSWORD=<your-postgres-password>
  DB_POOL_MAX=20
  DB_POOL_TIMEOUT=10000
  DB_CONNECTION_TIMEOUT=5000
  JWT_SECRET=<any-random-string>
  PORT=5000
  CORS_ORIGIN=http://localhost:5173
  ```

- **Quick health check.** Bookmark `http://localhost:5000/health` — if it returns `{"ok": true}`, the backend is alive.

---

## Summary

Here is the complete workflow in order:

1. Install **Node.js**, **PostgreSQL**, and **Git**.
2. Clone the repository and run `npm install` in both `backend/` and `frontend/`.
3. Create the database and apply schema: `cd backend && npm run migrate-pg`.
4. Create `backend/.env` with your PostgreSQL credentials and a JWT secret.
5. Start the backend: `cd backend && npm run dev`.
6. Start the frontend: `cd frontend && npm run dev` (in a separate terminal).
7. Create an admin user: `npm run seed-admin`.
8. Open **http://localhost:5173** and log in.

Two terminals, two commands, one browser tab — that is all it takes to have the full application running locally.

---

## PostgreSQL Quick Reference

```bash
# Start/stop PostgreSQL (Windows Services)
net start postgresql-x64-18
net stop postgresql-x64-18

# Connect to the database
psql -U postgres -h localhost -d office_management

# Useful psql commands
\dt          -- list tables
\d tables    -- describe a table
\q           -- quit

# Reset postgres password (if needed)
psql -U postgres -c "ALTER USER postgres PASSWORD 'newpassword';"

# Create database
createdb -U postgres office_management

# Rollback all tables (WARNING: deletes data)
node scripts/rollback_postgres.js
```

---

*Document created: August 14, 2026 · Last updated: August 27, 2026*
*Project: IT Inventory & Ticketing System (Office-management-system-Government-node)*
