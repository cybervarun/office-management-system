# User & Administrator Guide

**Version:** 2.0.0
**Date:** 2026-08-27
**Updated:** PostgreSQL migration complete — all MSSQL references replaced

---

# Part A — End-User Guide

## 1. Getting Started

### 1.1 Logging In

1. Open the application URL in a supported browser (Chrome 90+, Edge 90+, Firefox 88+).
2. Enter your assigned email address and password.
3. Click **Sign In**.

> **Note:** Your account must be activated by an Admin before you can log in.

### 1.2 Navigation

After logging in, the left sidebar provides access to:

| Menu Item | Description |
|-----------|-------------|
| **Dashboard** | Overview landing page |
| **Inventory** | View and manage IT assets |
| **Tickets** | View and manage support tickets |
| **Users** | User management (Admin only) |
| **Reports** | Analytics (coming soon) |
| **Settings** | System configuration (coming soon) |

---

## 2. Raising a Support Ticket

1. Navigate to **Raise Ticket** (linked from the top bar or side menu).
2. Fill in the required fields:
   - **Ticket Title** — brief summary of the issue
   - **Description** — detailed explanation
   - **Ministry, Department** — your organizational unit
   - **Asset User** — the person who uses the affected asset (optional: search existing users)
3. Optional fields:
   - **Inventory ID** — link to an existing asset record
   - **Block, Floor, Room, Workstation** — physical location
   - **Email, Phone** — contact details
4. Click **Raise Ticket**.
5. A confirmation message appears. The ticket is created with status **Open** and assigned to **IT Help Desk**.

---

## 3. Viewing Tickets

1. Navigate to **Tickets**.
2. Use the filter bar to narrow by:
   - **Status** — Open, In Progress, Pending, Resolved, Closed
   - **Team** — IT Help Desk, IT Team, Network Team, Cybersecurity Team
3. Click **Refresh** to reload the list.
4. Pagination controls at the bottom let you browse pages.

### 3.1 Updating a Ticket (Team Members)

If you belong to an assigned team:

1. Click on a ticket row to expand details.
2. **Change Status** — select from the dropdown and confirm.
3. **Add Work Note** — type your note and save.
4. **Transfer** — select a different team and optional note, then confirm.

---

## 4. Viewing Inventory

1. Navigate to **Inventory**.
2. Use filters to search by:
   - Ministry, Department, Asset Category
   - Current Status, EDR status, UEM status
3. Click **Refresh** to apply filters.
4. Click the **eye** (View) icon in a row to view full asset details in a modal.

---

## 5. Searching for a User

1. Navigate to **Inventory** → click the **Search User** button (or use the global search).
2. Type the user's name, email, or phone number.
3. Matching assets display in a list (top 25 results).

---

# Part B — Administrator Guide

## 1. System Setup

### 1.1 Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- npm or yarn package manager

### 1.2 Environment Configuration

Create `backend/.env` with the following variables:

```env
# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=office_management
DB_USER=postgres
DB_PASSWORD=your-postgres-password

# Connection pool
DB_POOL_MAX=20
DB_POOL_TIMEOUT=10000
DB_CONNECTION_TIMEOUT=5000

# Application
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
PORT=5000

# CORS (production only — comma-separated origins)
# CORS_ORIGIN=https://inventory.gov.in,https://helpdesk.gov.in
```

### 1.3 Database Initialization

```bash
cd backend
npm install
npm run migrate-pg    # Applies PostgreSQL_Schema_DDL.sql to PostgreSQL
node scripts/create_admin.js    # Creates the first Admin account
```

**Seeding the Admin Account:**

```bash
# Option A: Provide password via environment variable (min 12 characters)
ADMIN_PASSWORD=MySecurePass123! node scripts/create_admin.js

# Option B: Generate a one-time password
node scripts/create_admin.js -- --reset
# Output: [create_admin] ONE-TIME PASSWORD (deliver securely, do not commit): abcdef...
```

### 1.4 Starting the Application

```bash
# Terminal 1 — Backend
cd backend
npm run dev          # Nodemon hot reload on :5000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev          # Vite dev server on :5173
```

Open `http://localhost:5173` in your browser.

### 1.5 Production Build

```bash
cd frontend
npm run build        # Outputs to frontend/dist
cd ../backend
npm run prod         # NODE_ENV=production node app.js
```

---

## 2. User Management

### 2.1 Creating a New User

1. Navigate to **Users**.
2. Click **Create User**.
3. Fill in:
   - **Name** — full name
   - **Email** — unique login email
   - **Phone** — optional contact number
   - **Role** — select from dropdown
   - **Password** — minimum 8 characters
4. Click **Create User**.

**Roles and Their Permissions:**

| Role | Can View Inventory | Can Edit Inventory | Can Manage Users | Can Create Tickets | Can Update Tickets |
|------|:---:|:---:|:---:|:---:|:---:|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Help Desk | ✅ | ✅ | ❌ | ✅ | ✅ |
| IT Team | ✅ | ❌ | ❌ | ✅ | ✅ |
| Network Team | ✅ | ❌ | ❌ | ✅ | ✅ |
| Cybersecurity | ✅ | ❌ | ❌ | ✅ | ✅ |

### 2.2 Changing a User's Role

1. Find the user in the list.
2. Click the **Edit** (pencil) icon in the user's row.
3. Modify fields and click **Save Changes**.

### 2.3 Resetting a User's Password

1. Find the user in the list.
2. Click the **Edit** (pencil) icon in the user's row.
3. Modify fields as needed and click **Save Changes**.

### 2.4 Activating / Deactivating a User

1. Find the user in the list.
2. Click the **Activate** or **Deactivate** button.
3. Deactivated users cannot log in; their records are preserved.

---

## 3. Inventory Management

### 3.1 Adding an Asset

1. Navigate to **Inventory**.
2. Click **Add Asset**.
3. Fill in all sections:

**Section 1 — Basic Information (required):**
- Ministry, Department, Asset Category, Asset Description

**Section 2 — Location (optional):**
- Block Name, Floor, Room, Workstation

**Section 3 — Asset Details (required fields marked):**
- Serial Number **or** MAC Address (at least one required for Asset ID generation)
- IP Address (format: `192.168.1.1`)
- Operating System
- Make/Brand/Model

**Section 4 — Security (optional):**
- EDR Installed: Yes/No — if No, provide reason
- UEM Installed: Yes/No — if No, provide reason

**Section 5 — Ownership (required):**
- Asset User, Asset Custodian, Current Status

**Section 6 — Lifecycle (optional dates):**
- Purchase Date, Installation Date, End of Support, End of Life, AMC Warranty Expiry

4. Click **Add Asset** to save.

### 3.2 Editing an Asset

1. Find the asset in the list.
2. Click the eye icon to view the asset, then use the Edit form.
3. Modify fields and click **Save Changes**.

### 3.3 Bulk Import via CSV

1. Click **Import CSV** on the Inventory page.
2. Download the template CSV to see required columns.
3. Fill in rows, ensuring at least one of `serial_number` or `mac_address` per row.
4. Upload the file.
5. Conflicts (duplicate serial/MAC) are skipped with a warning.

---

## 4. Ticket Management

### 4.1 Assigning a Ticket

1. Navigate to **Tickets**.
2. Find the ticket to assign.
3. Click **Assign** → select target team → add optional note → Save.

### 4.2 Transferring a Ticket

1. Open a ticket detail view.
2. Click **Transfer** → select target team → add note → Save.
3. The action is logged in the ticket history.

---

## 5. Managing Dropdown Values

When a dropdown option (e.g., a new ministry or department) is needed:

1. Navigate to **Inventory** → use the dropdown management interface (integrated into the Add Asset form's dropdown section).
2. Select the field type (Ministry, Department, Asset Category, OS, Network Type).
3. Enter the new value.
4. Click **Add**. The value is saved and immediately available in forms.

---

## 6. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Backend won't start | Missing `DB_PASS` env var | Set `DB_PASS` in `backend/.env` |
| Backend: "DB Connection Failed" | PostgreSQL unreachable | Verify `DB_HOST`, `DB_PORT`, `DB_PASSWORD` |
| Frontend: "Network Error" | Backend not running | Start backend with `npm run dev` |
| Login: "Invalid credentials" | Wrong email/password or account inactive | Verify credentials; ask Admin to activate account |
| Login: "User is inactive" | `is_active = 0` | Admin must click Activate |
| Asset save: "Duplicate serial_number" | Serial already exists | Use a unique serial or check existing record |
| MAC address validation fails | Wrong format | Use format `AA:BB:CC:DD:EE:FF` or `AA-BB-CC-DD-EE-FF` |

---

## 7. Security Notes

- Session tokens expire after **8 hours**. Log out and back in if you get redirected.
- Never share your password. Admins will never ask for it.
- All data is stored on the office PostgreSQL server — no data leaves the internal network.
- Report any suspicious login activity to the IT Admin immediately.
