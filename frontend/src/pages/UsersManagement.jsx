import { useEffect, useState } from "react";
import { FiPlus, FiUsers, FiEdit2, FiCheck, FiX, FiPower } from "react-icons/fi";
import { createUser, getUsers, editUserApi, activateUser, deactivateUser } from "../services/userService";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import FormInput from "../components/ui/FormInput";
import FormSection from "../components/ui/FormSection";
import Modal from "../components/ui/Modal";
import { ROLES } from "../utils/roles";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  role: "Help Desk",
  password: ""
};

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const params = { page, pageSize: 10, sortBy: "created_at", sortDirection: "DESC" };
      if (roleFilter) params.role = roleFilter;

      const result = await getUsers(params);
      setUsers(Array.isArray(result.data) ? result.data : []);
      setPagination(result.pagination || { page, pageSize: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, roleFilter]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter]);

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await createUser(form);
      setForm(initialForm);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.error || err.response?.data?.details?.[0]?.msg || "Unable to create user");
    }
  };

  const openEdit = (user) => {
    setEditForm({ name: user.name, email: user.email, phone: user.phone || "", role: user.role });
    setEditUser(user);
    setEditOpen(true);
    setEditError("");
  };

  const saveEdit = async () => {
    if (!editUser) return;
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setEditError("Name and email are required");
      return;
    }
    setSavingEdit(true);
    setEditError("");
    try {
      await editUserApi(editUser.id, editForm);
      setEditOpen(false);
      setEditUser(null);
      await load();
      setToast("User updated successfully");
    } catch (err) {
      setEditError(err.response?.data?.error || "Edit failed");
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleActive = async (user, active) => {
    try {
      await (active ? activateUser(user.id) : deactivateUser(user.id));
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Action failed");
    }
  };

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>User Management</h1>
          <p>Create and manage system users with role-based access.</p>
        </div>
      </div>

      <section className="data-card">
        <div className="section-title">
          <h2>Create New User</h2>
        </div>
        <form className="grid-form" onSubmit={submit} style={{ padding: "0 18px 18px" }}>
          <input
            placeholder="Full Name"
            value={form.name}
            required
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            required
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <input
            type="password"
            placeholder="Password (min 8 chars)"
            value={form.password}
            required
            minLength={8}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button type="submit" icon={FiPlus}>Create User</Button>
        </form>
        {formError && <p className="error" style={{ padding: "0 18px 18px" }}>{formError}</p>}
      </section>

      <section className="data-card">
        <div className="section-title">
          <div>
            <h2>Users</h2>
            <p>{pagination.total} records found</p>
          </div>
        </div>

        <div className="filter-card" style={{ border: 0, boxShadow: "none", padding: "0 18px 12px" }}>
          <Select
            label="Role"
            options={["All", ...ROLES]}
            placeholder="All roles"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value === "All" ? "" : e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading-state">
            <span className="spinner" />
            Loading users
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <FiUsers aria-hidden="true" />
            <h2>No users found</h2>
            <p>Create a user or adjust the filter.</p>
          </div>
        ) : (
          <>
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td><Badge tone={u.role === "Admin" ? "info" : "neutral"}>{u.role}</Badge></td>
                      <td>{u.phone || "—"}</td>
                      <td><Badge tone={u.is_active ? "success" : "warning"}>{u.is_active ? "Yes" : "No"}</Badge></td>
                      <td>
                        <div className="table-actions">
                          <Button size="icon" variant="ghost" icon={FiEdit2} onClick={() => openEdit(u)}>Edit</Button>
                          <Button size="icon" variant="ghost" icon={u.is_active ? FiX : FiCheck} onClick={() => toggleActive(u, u.is_active)}>{u.is_active ? "Deactivate" : "Activate"}</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>
                Page {page} of {pagination.totalPages}
              </span>
              <div>
                <Button disabled={page <= 1} onClick={() => setPage((v) => v - 1)} variant="secondary">
                  Previous
                </Button>
                <Button disabled={page >= pagination.totalPages} onClick={() => setPage((v) => v + 1)} variant="secondary">
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit User - ${editUser?.name || ""}`}
        footer={
          <>
            <Button onClick={() => setEditOpen(false)} variant="secondary">Cancel</Button>
            <Button onClick={saveEdit} disabled={savingEdit}>{savingEdit ? "Saving…" : "Save Changes"}</Button>
          </>
        }
      >
        {editUser && (
          <div className="modal-form">
            {editError && <p className="alert alert-error" style={{marginBottom:'12px'}}>{editError}</p>}
            <FormSection title="User Details">
              <div className="form-grid-2">
                <FormInput label="Name" name="name" value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} type="text" />
                <FormInput label="Email" name="email" value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} type="email" />
                <FormInput label="Phone" name="phone" value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} type="text" />
                <Select label="Role" name="role" options={ROLES} value={editForm.role || ""} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} />
              </div>
            </FormSection>
          </div>
        )}
      </Modal>
    </section>
  );
}
