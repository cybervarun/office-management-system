import { useEffect, useMemo, useState } from "react";
import { FiSearch, FiTool } from "react-icons/fi";
import { getDropdowns, searchInventoryUser } from "../services/inventoryService";
import { createTicket } from "../services/ticketService";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import FormInput from "../components/ui/FormInput";
import FormSection from "../components/ui/FormSection";
import Select from "../components/ui/Select";

const initialForm = {
  title: "",
  description: "",
  inventory_id: "",
  ministry: "",
  department: "",
  block_name: "",
  floor: "",
  room: "",
  workstation: "",
  asset_user: "",
  division: "",
  designation: "",
  email: "",
  phone: "",
  custodian: ""
};

export default function RaiseTicketForm() {
  const [form, setForm] = useState(initialForm);
  const [dropdowns, setDropdowns] = useState({});
  const [search, setSearch] = useState("");
  const [matches, setMatches] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getDropdowns().then(setDropdowns).catch(() => setDropdowns({}));
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setMatches([]);
      return;
    }
    searchInventoryUser(search).then(setMatches).catch(() => setMatches([]));
  }, [search]);

  const canSubmit = useMemo(() => {
    return Boolean(form.title && form.description && form.asset_user && form.email);
  }, [form]);

  const onSelectUser = (row) => {
    setForm((prev) => ({
      ...prev,
      inventory_id: row.id,
      ministry: row.ministry || "",
      department: row.department || "",
      block_name: row.block_name || "",
      floor: row.floor || "",
      room: row.room || "",
      workstation: row.workstation || "",
      asset_user: row.asset_user || "",
      division: row.division || "",
      designation: row.designation || "",
      email: row.email || "",
      phone: row.phone || "",
      custodian: row.custodian || ""
    }));
    setSearch(row.asset_user || row.email || row.phone || "");
    setMatches([]);
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!canSubmit) {
      setError("Please fill required fields");
      return;
    }

    try {
      await createTicket({
        title: form.title,
        description: form.description,
        inventory_id: form.inventory_id ? Number(form.inventory_id) : null
      });
      setMessage("Ticket created successfully");
      setForm(initialForm);
      setSearch("");
    } catch (err) {
      setError(err.response?.data?.error || "Ticket creation failed");
    }
  };

  const handleChange = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Service Desk</p>
          <h1>Raise Ticket</h1>
          <p>Submit a new support request. Search for your asset to auto-fill location details.</p>
        </div>
      </div>

      {message && <div className="toast" role="status">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* User Search */}
      <section className="filter-card" aria-label="User search">
        <div className="filter-search">
          <FiSearch aria-hidden="true" />
          <input
            placeholder="Search user by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {matches.length > 0 && (
          <div className="user-match-list">
            {matches.map((m) => (
              <button key={m.id} type="button" className="user-match-row" onClick={() => onSelectUser(m)}>
                <strong>{m.asset_user}</strong>
                <span>{m.email}</span>
                <span>{m.phone || "—"}</span>
                <Badge tone="info">{m.ministry || "—"}</Badge>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="data-card">
        <div className="section-title">
          <h2>Ticket Details</h2>
        </div>
        <form className="modal-form" onSubmit={submit}>
          <FormSection title="Section 1: Ticket Information" description="Provide the ticket title and description">
            <div className="form-grid-2">
              <FormInput
                label="Ticket Title *"
                name="title"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                type="text"
                placeholder="Brief description of the issue"
              />
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="field">
                  <span>Ticket Description *</span>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows="4"
                    placeholder="Provide detailed description of the issue or request"
                  />
                </label>
              </div>
            </div>
          </FormSection>

          <FormSection title="Section 2: Asset & Location" description="Asset user details are auto-filled when you search and select a user">
            <div className="form-grid-4">
              <FormInput
                label="Asset User *"
                name="asset_user"
                value={form.asset_user}
                onChange={(e) => handleChange("asset_user", e.target.value)}
                type="text"
                placeholder="Name of the asset user"
              />
              <FormInput
                label="User Email *"
                name="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                type="email"
                placeholder="User email address"
              />
              <FormInput
                label="User Phone"
                name="phone"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                type="text"
                placeholder="User phone number"
              />
              <FormInput
                label="Asset Custodian"
                name="custodian"
                value={form.custodian}
                onChange={(e) => handleChange("custodian", e.target.value)}
                type="text"
                placeholder="Custodian name"
              />
              <Select
                label="Ministry"
                name="ministry"
                options={dropdowns.ministry || []}
                placeholder="Select Ministry"
                value={form.ministry}
                onChange={(e) => handleChange("ministry", e.target.value)}
              />
              <Select
                label="Department"
                name="department"
                options={dropdowns.department || []}
                placeholder="Select Department"
                value={form.department}
                onChange={(e) => handleChange("department", e.target.value)}
              />
              <Select
                label="Division"
                name="division"
                options={dropdowns.division || []}
                placeholder="Select Division"
                value={form.division}
                onChange={(e) => handleChange("division", e.target.value)}
              />
              <Select
                label="Designation"
                name="designation"
                options={dropdowns.designation || []}
                placeholder="Select Designation"
                value={form.designation}
                onChange={(e) => handleChange("designation", e.target.value)}
              />
              <FormInput
                label="Block"
                name="block_name"
                value={form.block_name}
                onChange={(e) => handleChange("block_name", e.target.value)}
                type="text"
                placeholder="Block name"
              />
              <FormInput
                label="Floor"
                name="floor"
                value={form.floor}
                onChange={(e) => handleChange("floor", e.target.value)}
                type="text"
                placeholder="Floor number"
              />
              <FormInput
                label="Room"
                name="room"
                value={form.room}
                onChange={(e) => handleChange("room", e.target.value)}
                type="text"
                placeholder="Room number"
              />
              <FormInput
                label="Workstation"
                name="workstation"
                value={form.workstation}
                onChange={(e) => handleChange("workstation", e.target.value)}
                type="text"
                placeholder="Workstation ID"
              />
            </div>
          </FormSection>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
            <Button type="button" variant="secondary" onClick={() => { setForm(initialForm); setSearch(""); }}>
              Reset
            </Button>
            <Button type="submit" icon={FiTool} disabled={!canSubmit}>
              Raise Ticket
            </Button>
          </div>
        </form>
      </section>
    </section>
  );
}
