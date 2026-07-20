import { useEffect, useMemo, useState } from "react";
import { getDropdowns, searchInventoryUser } from "../services/inventoryService";
import { createTicket } from "../services/ticketService";

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

  const select = (name, value, values = []) => (
    <select value={value} onChange={(e) => setForm((prev) => ({ ...prev, [name]: e.target.value }))}>
      <option value="">Select {name}</option>
      {values.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
    </select>
  );

  return (
    <section>
      <h1>Raise Ticket Form</h1>
      <label>User Search (name/email/phone)</label>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user" />
      {matches.length > 0 && (
        <div className="results">
          {matches.map((m) => (
            <button key={m.id} type="button" onClick={() => onSelectUser(m)}>
              {m.asset_user} | {m.email} | {m.phone}
            </button>
          ))}
        </div>
      )}

      <form className="grid-form" onSubmit={submit}>
        <input placeholder="Ticket title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea placeholder="Ticket description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        {select("ministry", form.ministry, dropdowns.ministry || [])}
        {select("department", form.department, dropdowns.department || [])}
        {select("block_name", form.block_name, dropdowns.block_name || [])}
        {select("floor", form.floor, dropdowns.floor || [])}
        <input placeholder="Room" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
        <input placeholder="Workstation" value={form.workstation} onChange={(e) => setForm({ ...form, workstation: e.target.value })} />
        <input placeholder="Asset User" value={form.asset_user} onChange={(e) => setForm({ ...form, asset_user: e.target.value })} />
        {select("division", form.division, dropdowns.division || [])}
        {select("designation", form.designation, dropdowns.designation || [])}
        <input placeholder="User Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="User Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="Asset Custodian" value={form.custodian} onChange={(e) => setForm({ ...form, custodian: e.target.value })} />
        <button disabled={!canSubmit} type="submit">
          Raise Ticket
        </button>
      </form>
      {message && <p>{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
