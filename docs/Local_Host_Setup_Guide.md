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
| [SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (Developer edition is free) | Stores all application data | 2019 or later |
| [Git](https://git-scm.com/) | Downloads the project files | Any recent version |

**Optional but helpful:**
- [SQL Server Management Studio (SSMS)](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms) — visual database management
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

### Install SQL Server

1. Go to [Microsoft SQL Server Downloads](https://www.microsoft.com/en-us/sql-server/sql-server-downloads).
2. Download **SQL Server Developer Edition** (free for development and testing).
3. During installation, choose **Basic** or **Custom**:
   - If you choose **Custom**, note the install location.
4. When prompted for authentication mode, select **Windows Authentication** (simplest for local use). Alternatively, choose **Mixed Mode** and set a strong password for the `sa` account — you will need this password later.
5. Keep the default instance name (usually `SQLEXPRESS`) or note your custom name.

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

The app needs a database to store users, inventory items, and tickets. The project includes a schema file that creates everything automatically.

### Option A: Using SQL Server Management Studio (SSMS)

1. Open SSMS and connect to your SQL Server instance.
2. Open the file `backend/scripts/schema.sql` (inside the project folder).
3. Click **Execute** (or press F5). This creates the `OfficeManagement` database with all required tables.

### Option B: Using the command line

If you have the `sqlcmd` tool installed (comes with SQL Server):

```bash
cd backend
node scripts/apply_schema.js
```

This reads `schema.sql` and applies it to your database.

**Verify the database was created:**

In SSMS or `sqlcmd`, run:
```sql
SELECT name FROM sys.databases WHERE name = 'OfficeManagement';
```

You should see `OfficeManagement` in the results.

---

## 5. Configure the Backend

The backend reads its settings from a `.env` file. Create one now.

1. Navigate to the `backend` folder.
2. Create a file named `.env` with this content:

```ini
# Database connection
DB_SERVER=127.0.0.1
DB_PORT=1433
DB_NAME=OfficeManagement
DB_USER=sa
DB_PASS=YourStrongPassword123!
DB_ENCRYPT=false
DB_TRUST_CERT=true

# JWT secret (change this to any random string for local testing)
JWT_SECRET=local-dev-secret-key-change-in-production

# Server port
PORT=5000
```

**Important:** Replace `YourStrongPassword123!` with the actual password you set during SQL Server installation. If you used Windows Authentication, set `DB_USER` to your Windows username (e.g., `DELL`) and remove or leave `DB_PASS` empty — but note the app requires a password value, so Mixed Mode with the `sa` account is recommended.

---

## 6. Start the Backend Server

From the `backend` folder:

```bash
npm run dev
```

You should see output like:
```
Connecting to SQL Server 127.0.0.1:1433, database OfficeManagement, user sa
DB Connected
Server running on port 5000
```

**If you see `DB Connection Failed`**, check:
- SQL Server is running (open Services and look for "SQL Server").
- The password in `.env` matches your SQL Server password.
- Port 1433 is not blocked by a firewall.

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
| `DB_PASS is missing in .env` | The `.env` file is missing or empty | Create the `.env` file in the `backend` folder (see Step 5) |
| `DB Connection Failed` | SQL Server is not running or wrong credentials | Open Windows Services, find "SQL Server (MSSQLSERVER)" or "SQL Server (SQLEXPRESS)", and start it |
| `EACCES: permission denied` on port 5000 | Another process is using port 5000 | Change `PORT=5000` to another value (e.g., `PORT=5001`) in `backend/.env` and update `frontend/src/services/api.js` accordingly |
| Frontend shows a blank page or network error | Backend is not running | Make sure the backend terminal is still running (`npm run dev` in `backend/`) |
| `Cannot find module` errors after `npm install` | Dependencies not fully installed | Delete `node_modules` and `package-lock.json` in the failing folder, then run `npm install` again |
| Browser says "Not authorized" or redirects to login | JWT token expired or invalid | Log out and log back in; tokens expire after a period of inactivity |
| `SQL Server error: Login failed for user` | Wrong username or password in `.env` | Double-check `DB_USER` and `DB_PASS` match your SQL Server credentials |
| Port 5173 already in use | Another Vite instance is running | Close the other instance, or stop it with `Ctrl+C`, then re-run `npm run dev` |

---

## 11. Tips for Day-to-Day Development

- **Restart the backend after code changes.** Since we use `nodemon` (via `npm run dev`), backend files auto-reload. If you edit `app.js` or config files, nodemon restarts automatically.

- **Frontend also auto-reloads.** Vite's dev server watches for file changes and refreshes the browser instantly.

- **Keep both terminals visible.** One for the backend, one for the frontend. Errors appear in the terminal of whichever part failed.

- **Do not edit files in `frontend/dist`.** This folder is generated by `npm run build`. Always edit source files in `frontend/src/`.

- **Database changes require re-running the schema.** If you modify `backend/scripts/schema.sql`, run `npm run init-db` from the `backend` folder. Warning: this drops and recreates all tables — it will erase existing data.

- **Use a `.env` example for your team.** Create a `backend/.env.example` file with placeholder values (no real passwords) so new team members know what to fill in:

  ```ini
  DB_SERVER=127.0.0.1
  DB_PORT=1433
  DB_NAME=OfficeManagement
  DB_USER=sa
  DB_PASS=<your-sql-server-password>
  DB_ENCRYPT=false
  DB_TRUST_CERT=true
  JWT_SECRET=<any-random-string>
  PORT=5000
  ```

- **Quick health check.** Bookmark `http://localhost:5000/health` — if it returns `{"ok": true}`, the backend is alive.

---

## Summary

Here is the complete workflow in order:

1. Install **Node.js**, **SQL Server**, and **Git**.
2. Clone the repository and run `npm install` in both `backend/` and `frontend/`.
3. Create the database using `schema.sql` (via SSMS or `npm run init-db`).
4. Create `backend/.env` with your SQL Server credentials and a JWT secret.
5. Start the backend: `cd backend && npm run dev`.
6. Start the frontend: `cd frontend && npm run dev` (in a separate terminal).
7. Create an admin user: `npm run seed-admin`.
8. Open **http://localhost:5173** and log in.

Two terminals, two commands, one browser tab — that is all it takes to have the full application running locally.

---

*Document created: August 14, 2026 · Last updated: August 24, 2026*
*Project: IT Inventory & Ticketing System (Office-management-system-Government-node)*
