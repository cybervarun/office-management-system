import { useEffect, useState } from "react";
import { FiPlus, FiRefreshCw, FiTool, FiEye } from "react-icons/fi";
import { addTicketWorkNotes, listTickets, getTicket, transferTicket, updateTicketStatus } from "../services/ticketService";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import FormSection from "../components/ui/FormSection";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";

const STATUS_OPTIONS = ["All", "Open", "In Progress", "Pending", "Resolved", "Closed"];
const TEAM_OPTIONS = ["All", "IT Help Desk", "IT Team", "Network Team", "Cybersecurity Team"];

const statusTones = {
  Open: "info",
  "In Progress": "warning",
  Pending: "neutral",
  Resolved: "success",
  Closed: "neutral"
};

export default function TicketsList() {
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailTicket, setDetailTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const params = { page, pageSize: 10 };
      if (statusFilter && statusFilter !== "All") params.status = statusFilter;
      if (teamFilter && teamFilter !== "All") params.assigned_team = teamFilter;

      const result = await listTickets(params);
      setTickets(Array.isArray(result.data) ? result.data : []);
      setPagination(result.pagination || { page, pageSize: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, statusFilter, teamFilter]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, teamFilter]);

  const updateStatus = async (id, status) => {
    try {
      await updateTicketStatus(id, status);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Status update failed");
    }
  };

  const transfer = async (id, toTeam) => {
    try {
      await transferTicket({ ticketId: id, toTeam, note: "Transferred from ticket list" });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Transfer failed");
    }
  };

  const [noteInput, setNoteInput] = useState("");
  const [noteTarget, setNoteTarget] = useState(null);

  const openNoteInput = (id) => {
    setNoteTarget(id);
    setNoteInput("");
  };

  const submitNote = async () => {
    if (!noteInput.trim() || !noteTarget) return;
    try {
      await addTicketWorkNotes(noteTarget, noteInput.trim());
      setNoteTarget(null);
      setNoteInput("");
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Work note failed");
    }
  };

  const loadTicketDetail = async (id) => {
    setDetailLoading(true);
    try {
      const ticket = await getTicket(id);
      setDetailTicket(ticket);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load ticket details");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Service Desk</p>
          <h1>Tickets</h1>
          <p>Manage support tickets, assign teams, and track resolution progress.</p>
        </div>
        <Button icon={FiPlus} onClick={() => window.location.href = "/raise-ticket"}>
          Raise Ticket
        </Button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {noteTarget && (
        <div className="alert alert-info" style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <input
            style={{ flex: 1, padding: "6px 10px", border: "1px solid var(--border)", borderRadius: "6px", background: "var(--surface-2)", color: "var(--text-primary)", minWidth: 200 }}
            placeholder="Enter work note…"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitNote()}
            autoFocus
          />
          <Button size="sm" onClick={submitNote}>Submit</Button>
          <Button size="sm" variant="ghost" onClick={() => { setNoteTarget(null); setNoteInput(""); }}>Cancel</Button>
        </div>
      )}

      <div className="filter-card">
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          placeholder="All statuses"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
        <Select
          label="Team"
          options={TEAM_OPTIONS}
          placeholder="All teams"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
        />
        <div className="filter-actions">
          <Button icon={FiRefreshCw} onClick={() => { setStatusFilter(""); setTeamFilter(""); }} variant="ghost">
            Reset
          </Button>
        </div>
      </div>

      <section className="data-card">
        <div className="section-title">
          <div>
            <h2>Ticket List</h2>
            <p>{pagination.total} records found</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <span className="spinner" />
            Loading tickets
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <FiTool aria-hidden="true" />
            <h2>No tickets found</h2>
            <p>Raise a new ticket or adjust filters.</p>
          </div>
        ) : (
          <>
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Assigned Team</th>
                    <th>Created By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td><strong>{t.title}</strong></td>
                      <td><Badge tone={statusTones[t.status] || "neutral"}>{t.status}</Badge></td>
                      <td>{t.assigned_team}</td>
                      <td>{t.created_by_name || "—"}</td>
                      <td>
                        <div className="table-actions">
                          <Button size="icon" variant="ghost" icon={FiEye} onClick={() => loadTicketDetail(t.id)}>
                            Detail
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => updateStatus(t.id, "In Progress")}>
                            Start
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => updateStatus(t.id, "Closed")}>
                            Close
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => transfer(t.id, "IT Team")}>
                            To IT
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => transfer(t.id, "Network Team")}>
                            To Net
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => transfer(t.id, "Cybersecurity Team")}>
                            To Cyber
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openNoteInput(t.id)}>
                            Note
                          </Button>
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
      <Modal
        open={!!detailTicket}
        onClose={() => setDetailTicket(null)}
        title={`Ticket Detail - ${detailTicket?.id || ""}`}
        footer={
          <Button onClick={() => setDetailTicket(null)} variant="secondary">Close</Button>
        }
      >
        {detailLoading ? (
          <div className="loading-state">
            <span className="spinner" />
            Loading ticket details
          </div>
        ) : detailTicket ? (
          <div className="modal-form">
            <FormSection title="Ticket Information">
              <div className="form-grid-2">
                <FormSection title="Basic Info">
                  <div className="form-grid-2">
                    <div className="field field-readonly"><span>Title</span><input readOnly value={detailTicket.title || "—"} /></div>
                    <div className="field field-readonly"><span>Status</span><input readOnly value={detailTicket.status || "—"} /></div>
                    <div className="field field-readonly"><span>Assigned Team</span><input readOnly value={detailTicket.assigned_team || "Unassigned"} /></div>
                    <div className="field field-readonly"><span>Created By</span><input readOnly value={detailTicket.created_by_name || "—"} /></div>
                    <div className="field field-readonly"><span>Asset ID</span><input readOnly value={detailTicket.asset_id || "—"} /></div>
                    <div className="field field-readonly"><span>Created At</span><input readOnly value={detailTicket.created_at ? new Date(detailTicket.created_at).toLocaleString() : "—"} /></div>
                    <div style={{ gridColumn: "1 / -1" }} className="field field-readonly">
                      <span>Description</span>
                      <textarea rows="4" readOnly value={detailTicket.description || "—"} />
                    </div>
                  </div>
                </FormSection>
                <FormSection title="Work Notes & History">
                  <div className="form-grid-2">
                    <div className="field field-readonly">
                      <span>Work Notes</span>
                      <textarea rows="4" readOnly value={detailTicket.work_notes || "No work notes yet"} />
                    </div>
                  </div>
                </FormSection>
              </div>
            </FormSection>
          </div>
        ) : null}
      </Modal>
    </section>
    </section>
  );
}
