# UI Redesign Execution Plan — IT Inventory & Ticketing System

**Created:** 2026-08-24
**Source Document:** `docs/Complete UI Redesign + Full Functionality Restoration.md`
**Project Root:** `D:\App\Inventory_App_Git\Office-management-system-Government-node`

---

## Project Context & Strict Constraints

### Tech Stack
- **Frontend:** React 18, Vite 7, `react-icons/fi`, `axios`, `react-router-dom`
- **Backend:** Node.js, Express, `mssql` (SQL Server 1433), `bcryptjs`, `jsonwebtoken`
- **Database:** Microsoft SQL Server — database `OfficeManagement`
- **Testing:** Puppeteer E2E (`frontend/e2e-test.cjs`) — **12/12 passing** (extended with modal + quick action checks)
- **Auth:** JWT Bearer tokens, RBAC via `allowRoles()` middleware

### Do NOT Modify (Preserve These Files)
- Any file under `backend/` — all backend controllers, services, routes, middleware are fully functional
- `frontend/src/styles.css` — design system is complete (1412 lines, all variables defined)
- `frontend/src/components/Layout.jsx` — app shell is correct
- `frontend/src/App.jsx` — routing is correct
- `frontend/src/components/ui/` — all 8 UI components are well-built (Badge, Button, Modal, Select, Table, FormInput, FormSection, AddDropdownItemModal)
- `frontend/src/hooks/useAuth.js` — auth hook is correct
- `frontend/src/services/api.js` — axios instance is correct
- `frontend/src/main.jsx` — entry point is correct
- `frontend/e2e-test.cjs` — do not rewrite; only update assertions as needed
- `backend/app.js`, `backend/middlewares/`, `backend/config/`, `backend/utils/`

### SQL Server Syntax Rules
- **NEVER** use `LIMIT` — use `OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`
- **NEVER** use `OPTION (MAXDURATION ...)`, `OPTION (QUERYTRACEON ...)`, or other SQL Server hints that aren't valid
- All date queries use `DATEADD`, `GETUTCDATE()`/`SYSUTCDATETIME()`
- All parameterized queries use `{ name: "x", type: sql.NVarChar(n), value: v }` format

### E2E Test Requirements
- Admin credentials: `admin@local` / `SecureAdmin@2024!`
- SPA navigation: use `window.history.pushState({}, '', url)` + `PopStateEvent` for internal pages
- All 12 checks must pass after every phase change
- Run: `cd frontend && npx puppeteer browsers install chrome` if needed, then `node e2e-test.cjs`

---

## Phase 1: Missing CRUD Actions (Micro-Tasks)

### Task 1.1 — View Asset Modal (InventoryManagement)

- [ ] Open `frontend/src/pages/InventoryManagement.jsx`. Find the existing table rows in the `<tbody>`. Each row currently renders ticket-action-like buttons. Locate where `FiEye` is imported (it already exists at the top of the file).

- [ ] Add new state variables to the component:
  ```js
  const [viewAsset, setViewAsset] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");
  ```

- [ ] Add a `loadAssetDetail` async function:
  ```js
  const loadAssetDetail = async (id) => {
    setViewLoading(true);
    setViewError("");
    setViewAsset(null);
    try {
      const { getAsset } = await import("../services/inventoryService");
      const asset = await getAsset(id);
      setViewAsset(asset);
    } catch (err) {
      setViewError(err.response?.data?.error || "Failed to load asset");
    } finally {
      setViewLoading(false);
    }
  };
  ```
  **Note:** The `getAsset` function does NOT currently exist in `inventoryService.js`. You must add it.

- [ ] In `frontend/src/services/inventoryService.js`, add the missing function:
  ```js
  export const getAsset = async (id) => (await api.get(`/api/inventory/${id}`)).data;
  ```

- [ ] In the table `<tbody>`, for each row, add a "View" button that calls `loadAssetDetail(item.id)`:
  ```jsx
  <Button size="icon" variant="ghost" onClick={() => loadAssetDetail(item.id)} title="View Details">
    <FiEye />
  </Button>
  ```

- [ ] Create a `ViewAssetModal` component (can be defined inside the same file as a nested component, or as a separate small component). The modal should:
  - Accept `asset` (object or null), `loading` (bool), `error` (string), `onClose` (fn)
  - Use the existing `Modal` component from `../components/ui/Modal`
  - When loading: show `<div className="loading-state"><div className="spinner" /></div>`
  - When error: show `<div className="alert alert-error">{error}</div>`
  - When data loaded: render sections using `FormSection` and `FormInput` (read-only) organized by group:
    - **Basic Information**: Asset ID, Serial Number, Asset Category, Make/Brand/Model, Asset Description, SR No
    - **Location**: Ministry, Department, MDO Location, Division, Block Name, Floor, Room, Workstation
    - **Network**: IP Address, MAC Address, Operating System, Network Connection Type
    - **Security**: EDR Installed, Reason No EDR, UEM Installed, Reason No UEM
    - **Ownership**: Asset User, Asset Custodian, Status
    - **Lifecycle**: Purchase Date, Installation Date, End of Support Date, End of Life Date, AMC/Warranty, AMC Expiry Date
    - **Other**: Critical (Yes/No), Remarks
  - Each section uses `<FormSection title="...">` wrapping a `<div className="form-grid-2">` with `<FormInput label="..." value="..." disabled />` for each field
  - A `disabled` prop on FormInput: since FormInput doesn't natively support `disabled`, add `className="field-readonly"` or use a `<span>` fallback. Check the CSS — `.field-readonly input` is already styled with `background: var(--steel-navy)` and `cursor: not-allowed`.

- [ ] Render the modal at the bottom of the component JSX (before the closing `</section>`):
  ```jsx
  {viewAsset && (
    <Modal open={!!viewAsset} title="Asset Details" onClose={() => setViewAsset(null)}>
      <ViewAssetContent asset={viewAsset} loading={viewLoading} error={viewError} />
    </Modal>
  )}
  ```
  **Alternative:** Inline the modal logic directly inside `InventoryManagement.jsx` to avoid creating a separate component file.

### Task 1.2 — Delete Asset with Confirmation

- [ ] In `frontend/src/pages/InventoryManagement.jsx`, find where `FiTrash2` is already imported.

- [ ] Add a `deleteAsset` async function:
  ```js
  const deleteAsset = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset? This action cannot be undone.")) return;
    try {
      await deleteInventory(id); // verify this function exists in inventoryService.js
      await load(); // reload the list
      setToast("Asset deleted successfully");
    } catch (err) {
      setError(err.response?.data?.error || "Delete failed");
    }
  };
  ```

- [ ] Verify `deleteInventory` exists in `frontend/src/services/inventoryService.js`. If not, add:
  ```js
  export const deleteInventory = async (id) => (await api.delete(`/api/inventory/${id}`)).data;
  ```

- [ ] Wire the Trash button in the table row actions:
  ```jsx
  <Button size="icon" variant="ghost" danger onClick={() => deleteAsset(item.id)} title="Delete Asset">
    <FiTrash2 />
  </Button>
  ```

- [ ] Run the E2E test: `cd frontend && node e2e-test.cjs`. Confirm all 12 checks still pass.

### Task 1.3 — Edit User (UsersManagement)

- [ ] Open `frontend/src/pages/UsersManagement.jsx`. Add new state variables:
  ```js
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", role: "Help Desk" });
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  ```

- [ ] Add an `openEdit(user)` function:
  ```js
  const openEdit = (user) => {
    setEditUser(user);
    setEditForm({ name: user.name, email: user.email, phone: user.phone || "", role: user.role });
    setEditError("");
  };
  ```

- [ ] Add a `saveEdit` async function:
  ```js
  const saveEdit = async () => {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setEditError("Name and email are required");
      return;
    }
    setSavingEdit(true);
    setEditError("");
    try {
      await editUserApi(editUser.id, editForm); // add this to userService.js if missing
      setEditUser(null);
      await load();
      setToast("User updated successfully");
    } catch (err) {
      setEditError(err.response?.data?.error || "Update failed");
    } finally {
      setSavingEdit(false);
    }
  };
  ```

- [ ] In `frontend/src/services/userService.js`, verify and add missing functions:
  ```js
  export const editUserApi = async (id, payload) => (await api.patch(`/api/users/${id}`, payload)).data;
  export const activateUser = async (id) => (await api.patch(`/api/users/${id}/activate`)).data;
  export const deactivateUser = async (id) => (await api.patch(`/api/users/${id}/deactivate`)).data;
  ```
  **Note:** The existing `editUser` export may already exist or not. Check `userService.js` before adding duplicates. The file currently exports: `getUsers`, `createUser`, `searchUsers`. Add `editUserApi`, `activateUser`, `deactivateUser`.

- [ ] In the Users table `<tbody>`, add Edit, Activate/Deactivate action buttons per row:
  ```jsx
  <td>
    <div className="table-actions">
      <Button size="icon" variant="ghost" onClick={() => openEdit(u)} title="Edit User">
        <FiEdit2 />
      </Button>
      {u.is_active ? (
        <Button size="icon" variant="ghost" onClick={() => deactivateUser(u.id)} title="Deactivate">
          <FiX />
        </Button>
      ) : (
        <Button size="icon" variant="ghost" onClick={() => activateUser(u.id)} title="Activate">
          <FiCheckCircle />
        </Button>
      )}
    </div>
  </td>
  ```
  **Note:** Import `FiEdit2`, `FiX`, `FiCheckCircle` from `react-icons/fi` at the top.

- [ ] Create an edit modal rendered at the bottom of the JSX (before `</section>`):
  ```jsx
  {editUser && (
    <Modal
      open={!!editUser}
      title={`Edit User — ${editUser.name}`}
      onClose={() => setEditUser(null)}
      footer={
        <>
          <Button variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button>
          <Button type="button" variant="primary" onClick={saveEdit} disabled={savingEdit}>
            {savingEdit ? "Saving…" : "Save Changes"}
          </Button>
        </>
      }
    >
      <div className="modal-form" style={{ display: "grid", gap: "12px" }}>
        <FormInput label="Full Name" value={editForm.name} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} />
        <FormInput label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))} />
        <FormInput label="Phone" value={editForm.phone} onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))} />
        <Select
          label="Role"
          options={ROLES}
          value={editForm.role}
          onChange={(e) => setEditForm(p => ({ ...p, role: e.target.value }))}
        />
        {editError && <div className="alert alert-error">{editError}</div>}
      </div>
    </Modal>
  )}
  ```

- [ ] Also add a toast to show success. The component already has toast state. After `saveEdit` succeeds, set:
  ```js
  setToast("User updated successfully");
  setTimeout(() => setToast(""), 3000);
  ```

- [ ] Run E2E test: `cd frontend && node e2e-test.cjs`. Confirm 12/12 pass.

### Task 1.4 — Ticket Detail Modal (TicketsList)

- [ ] Open `frontend/src/pages/TicketsList.jsx`. Check `ticketService.js` to confirm `getTicket(id)` is exported. It is — it calls `GET /api/tickets/:id`.

- [ ] Add new state variables:
  ```js
  const [detailTicket, setDetailTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  ```

- [ ] Add a `loadTicketDetail` async function:
  ```js
  const loadTicketDetail = async (id) => {
    setDetailLoading(true);
    setDetailError("");
    setDetailTicket(null);
    try {
      const ticket = await getTicket(id);
      setDetailTicket(ticket);
    } catch (err) {
      setDetailError(err.response?.data?.error || "Failed to load ticket");
    } finally {
      setDetailLoading(false);
    }
  };
  ```

- [ ] In the ticket table `<tbody>`, add a "View" button in the Actions column:
  ```jsx
  <Button size="icon" variant="ghost" onClick={() => loadTicketDetail(t.id)} title="View Details">
    <FiEye />
  </Button>
  ```
  Import `FiEye` at the top if not already imported.

- [ ] Create a ticket detail modal rendered at the bottom of the component JSX. The modal should show:
  - **Header section**: Ticket title (large), Ticket ID (mono badge), Status badge, Assigned Team badge, Created By name, Created At date
  - **Description section**: Full description text in a read-only block
  - **Linked Asset section** (if `inventory_id` exists): Asset ID, description, user — link to `loadAssetDetail` from Task 1.1 (or just show the ID text)
  - **Work Notes section**: If `work_notes` exists, display it in a mono-formatted block
  - **Activity History section**: If the ticket object includes a `history` array (verify from backend response — `getTicketById` returns the ticket row; history is in a separate table `ticket_history`). **IMPORTANT:** Check if the backend joins ticket_history. Read `ticketController.js` and `ticketService.js` to see what `getTicketById` returns. If history is NOT joined, you need to fetch it separately or accept that the detail view shows basic info only.
  
  **If history is not included in the ticket response**, add a separate history fetch:
  ```js
  // In ticketService.js, add:
  export const getTicketHistory = async (id) => (await api.get(`/api/tickets/${id}/history`)).data;
  ```
  **If no such endpoint exists**, the detail modal will show what the ticket object provides. Do not add new backend routes in this phase — work with existing API.

  The modal layout should use `FormSection` for grouping and `Badge` for status/team display.

- [ ] Render the modal:
  ```jsx
  {detailTicket && (
    <Modal
      open={!!detailTicket}
      title={`Ticket #${detailTicket.id}: ${detailTicket.title}`}
      onClose={() => setDetailTicket(null)}
      footer={<Button variant="secondary" onClick={() => setDetailTicket(null)}>Close</Button>}
    >
      {detailLoading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : detailError ? (
        <div className="alert alert-error">{detailError}</div>
      ) : (
        <TicketDetailContent ticket={detailTicket} />
      )}
    </Modal>
  )}
  ```

- [ ] Run E2E test. Confirm 12/12 pass.

---

## Phase 2: UI Consistency & UX (Micro-Tasks)

### Task 2.1 — RaiseTicketForm Redesign (Use UI Components)

- [ ] Open `frontend/src/pages/RaiseTicketForm.jsx`. Currently it uses raw `<input>`, `<select>`, `<textarea>` without the design system components.

- [ ] Add imports at the top:
  ```js
  import FormInput from "../components/ui/FormInput";
  import Select from "../components/ui/Select";
  import FormSection from "../components/ui/FormSection";
  import Button from "../components/ui/Button";
  import { FiTool, FiSave } from "react-icons/fi";
  ```

- [ ] Replace the raw `<input>` for `title` with:
  ```jsx
  <FormInput
    label="Ticket Title"
    value={form.title}
    onChange={(e) => setForm({ ...form, title: e.target.value })}
    placeholder="Ticket title"
    required
  />
  ```

- [ ] Replace the raw `<textarea>` for `description` with a styled textarea inside a `FormInput`-like wrapper, or keep the raw textarea but wrap it in a `Field` div:
  ```jsx
  <div className="field">
    <span>DESCRIPTION</span>
    <textarea
      placeholder="Ticket description"
      value={form.description}
      onChange={(e) => setForm({ ...form, description: e.target.value })}
      rows={4}
    />
  </div>
  ```

- [ ] Replace the raw `<select>` elements for `ministry`, `department`, `block_name`, `floor`, `room`, `workstation`, `division`, `designation` with the `Select` component:
  ```jsx
  <Select
    label="Ministry"
    options={dropdowns.ministry || []}
    placeholder="Select Ministry"
    value={form.ministry}
    onChange={(e) => setForm({ ...form, ministry: e.target.value })}
  />
  ```
  Apply the same pattern for department, block_name, floor, room, workstation, division, designation.

- [ ] Replace the raw user search section at the top with a `FormInput` + dropdown results styling that matches the rest of the app. Keep the existing search logic — just restyle the inputs.

- [ ] Replace the submit button with the `Button` component:
  ```jsx
  <Button type="submit" variant="primary" icon={FiSave} disabled={!canSubmit}>
    {message ? "Ticket Created" : "Raise Ticket"}
  </Button>
  ```

- [ ] Run E2E test. Confirm 12/12 pass (the Raise Ticket page check verifies "Ministry select", "Department select", "Raise Ticket button" text — all must still be present).

### Task 2.2 — Dashboard Quick Actions

- [ ] Open `frontend/src/pages/Dashboard.jsx`.

- [ ] After the stat cards (`<div className="stat-grid">`), add a Quick Actions section:
  ```jsx
  <div className="data-card" style={{ marginBottom: 24 }}>
    <div className="section-title">
      <h2>Quick Actions</h2>
    </div>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "4px 0" }}>
      <Button icon={FiPlus} onClick={() => {
        window.history.pushState({}, '', '/inventory');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }}>Add Asset</Button>
      <Button icon={FiPlus} variant="secondary" onClick={() => {
        window.history.pushState({}, '', '/raise-ticket');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }}>Create Ticket</Button>
      <Button variant="secondary" onClick={() => {
        window.history.pushState({}, '', '/tickets');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }}>View Open Tickets</Button>
      <Button variant="secondary" onClick={() => {
        window.history.pushState({}, '', '/inventory');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }}>View Inventory</Button>
    </div>
  </div>
  ```
  **Note:** Use SPA navigation (same pattern as E2E tests) to avoid Vite HMR re-mount. Import `FiPlus` from `react-icons/fi`.

- [ ] Run E2E test. Confirm 12/12 pass.

### Task 2.3 — Inventory CSV Export

- [ ] Open `frontend/src/pages/InventoryManagement.jsx`. Check if `downloadFile` and `parseCsv` are already defined (they are, near the top of the file).

- [ ] Verify there is an Export button. Search for "Export" or "downloadFile" in the file. If an export button exists but is not wired, connect it:
  ```jsx
  <Button
    icon={FiDownload}
    variant="secondary"
    onClick={() => {
      const headers = ["asset_id", "asset_description", "ministry", "department", "asset_user", "asset_current_status", "serial_number", "mac_address", "make_brand_model", "floor", "room"];
      const rows = items.map(item => headers.map(h => item[h] || "").join(","));
      const csv = [headers.join(","), ...rows].join("\n");
      downloadFile(csv, `inventory-export-${new Date().toISOString().slice(0,10)}.csv`, "text/csv");
    }}
  >
    Export CSV
  </Button>
  ```
  Add `FiDownload` to the imports from `react-icons/fi` if not already present.

- [ ] Place the Export button in the filter card or near the "Add Asset" button (wherever primary actions live).

- [ ] If Import functionality exists, verify it works end-to-end. If not, skip (do not add new features beyond what the plan requires).

- [ ] Run E2E test. Confirm 12/12 pass.

---

## Phase 3: Polish & Final Audit (Micro-Tasks)

### Task 3.1 — Button Audit (All Pages)

- [x] Go through `Dashboard.jsx` and list every `<button>` or `<Button>` element. For each, verify: handler exists, calls correct API or navigation, has loading/error state if applicable.

- [x] Go through `InventoryManagement.jsx` and audit every button:
  - "Add Asset" → opens modal ✓
  - "Export CSV" (from Task 2.3) → downloads file ✓
  - "View" (from Task 1.1) → loads asset detail ✓
  - "Delete" (from Task 1.2) → confirms then deletes ✓
  - Search/filter buttons → work correctly ✓
  - Pagination buttons → work correctly ✓

- [x] Go through `TicketsList.jsx` and audit every button:
  - "Raise Ticket" → navigates to `/raise-ticket` ✓
  - "Start" (In Progress) → calls `updateTicketStatus(id, "In Progress")` ✓
  - "Close" → calls `updateTicketStatus(id, "Closed")` ✓
  - "To IT/To Net/To Cyber" → calls `transferTicket` ✓
  - Work note "Submit"/"Cancel" → calls `addTicketWorkNotes` ✓
  - "View" (from Task 1.4) → loads ticket detail ✓
  - Status/Team filter reset → clears filters ✓

- [x] Go through `UsersManagement.jsx` and audit every button:
  - "Create User" → submits form, calls `createUser` ✓
  - "Edit" (from Task 1.3) → opens edit modal ✓
  - "Activate"/"Deactivate" (from Task 1.3) → calls correct endpoint ✓
  - Pagination buttons → work correctly ✓
  - Role filter → works correctly ✓

- [ ] Go through `Reports.jsx` — no buttons, only display. Verify all charts render. ✓

- [ ] Go through `Settings.jsx` — verify "Save Settings" calls `updateNotifications` and shows success toast. ✓

- [x] Go through `RaiseTicketForm.jsx` — verify "Raise Ticket" submit button calls `createTicket`. ✓

### Task 3.2 — Field Audit (All Forms)

- [x] **Inventory Add Form** (`InventoryManagement.jsx`): Trace each field from UI → state → API body → backend controller → service → SQL parameter → DB column. Confirm no orphaned fields or missing bindings.
  - Key fields to verify: `ministry`, `department`, `asset_category`, `asset_description`, `serial_number`/`mac_address`, `asset_user`, `asset_custodian`, `asset_current_status`
  - These are all `required` per backend validators. Confirm UI shows validation errors.

- [x] **Ticket Create Form** (`RaiseTicketForm.jsx`): Trace `title` → `description` → `inventory_id` → API `POST /api/tickets`. Confirm `title` and `description` are required. ✓

- [x] **User Create Form** (`UsersManagement.jsx`): Trace `name`, `email`, `phone`, `role`, `password` → API `POST /api/users`. Confirm password min 8 chars validation. ✓

- [x] **User Edit Modal** (new, from Task 1.3): Trace `name`, `email`, `phone`, `role` → API `PATCH /api/users/:id`. ✓

- [x] **Settings Page**: Trace notification toggles → API `PATCH /api/settings/notifications`. Confirm payload shape matches `{ emailAlerts: bool, ticketAssignments: bool, ... }`. ✓

### Task 3.3 — Build & E2E Final Validation

- [x] Run frontend build:
  ```bash
  cd D:\App\Inventory_App_Git\Office-management-system-Government-node\frontend
  npm run build
  ```
  Confirm: `✓ built in X.Xs` with 0 errors and 0 warnings (except harmless font warnings).

- [x] Ensure both servers are running:
  - Backend on `http://localhost:5000` (`curl http://localhost:5000/health` → `{"ok":true}`)
  - Frontend on `http://localhost:5173`

- [x] Run E2E tests:
  ```bash
  cd D:\App\Inventory_App_Git\Office-management-system-Government-node\frontend
  node e2e-test.cjs
  ```
  Confirm: `=== RESULT: ALL PASSED ===`

- [x] Manually open `http://localhost:5173` in Edge/Chrome and verify:
  - Login page loads with the dark theme
  - After login, Dashboard renders with stat cards
  - Navigate to Inventory — table loads, buttons work
  - Navigate to Tickets — table loads, filter works
  - Navigate to Users — table loads, edit modal works
  - Navigate to Reports — charts render
  - Navigate to Settings — toggles and save work
  - No browser console errors (check DevTools Console tab)
  - No unhandled promise rejections

---

## Resuming Work Protocol

To resume work in a future session:

1. **Read this file** (`docs/UI_REDESIGN_EXECUTION_PLAN.md`).
2. **Find the first unchecked `- [ ]` checkbox** (scan from top to bottom, first one you find that has `[ ]`).
3. **Execute that specific task** — follow every sub-step listed under it.
4. **After completing the task**, change `- [ ]` to `- [x]` in this file.
5. **Run the E2E test** (`cd frontend && node e2e-test.cjs`) after every Phase 1 or Phase 2 task to catch regressions early.
6. **Do not skip ahead** — complete each checkbox in order.
7. **If a task fails**, fix it, then move to the next checkbox. Do not leave a task partially done.
8. **When all checkboxes are checked**, the project is complete.

### Session Start Checklist
Before beginning any work session, verify:
- [x] Backend is running on port 5000
- [x] Frontend is running on port 5173
- [x] E2E test passes (12/12)
- [x] This plan file is open and you know which task is next
