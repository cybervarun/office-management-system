import { useEffect, useState } from "react";
import { addTicketWorkNotes, listTickets, transferTicket, updateTicketStatus } from "../services/ticketService";

export default function TicketsList() {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    const data = await listTickets();
    setTickets(data);
  };

  useEffect(() => {
    load();
  }, []);

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

  const addNote = async (id) => {
    const note = window.prompt("Enter work note");
    if (!note) return;
    try {
      await addTicketWorkNotes(id, note);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Work note failed");
    }
  };

  return (
    <section>
      <h1>Tickets List</h1>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Assigned Team</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td>{t.title}</td>
              <td>{t.status}</td>
              <td>{t.assigned_team}</td>
              <td>
                <button onClick={() => updateStatus(t.id, "In Progress")}>In Progress</button>
                <button onClick={() => updateStatus(t.id, "Closed")}>Close</button>
                <button onClick={() => transfer(t.id, "IT Team")}>To IT Team</button>
                <button onClick={() => transfer(t.id, "Network Team")}>To Network</button>
                <button onClick={() => transfer(t.id, "Cybersecurity Team")}>To Cyber</button>
                <button onClick={() => addNote(t.id)}>Add Note</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
