import { useEffect, useState } from "react";
import { FiBox, FiClock, FiTool, FiUsers } from "react-icons/fi";
import { getReports } from "../services/reportsService";

function BarChart({ data, color, maxVal }) {
  if (!data || data.length === 0) return <div className="chart-empty">No data available</div>;
  return (
    <div className="bar-chart">
      {data.map((item, i) => {
        const pct = maxVal ? (item.count / maxVal) * 100 : 0;
        return (
          <div key={i} className="bar-row">
            <span className="bar-label" title={item.label}>{item.label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="bar-count">{item.count}</span>
          </div>
        );
      })}
    </div>
  );
}

function DonutSegment({ pct, color, label }) {
  return (
    <div className="donut-row">
      <div className="donut-track">
        <div className="donut-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="donut-label">{label}</span>
    </div>
  );
}

function MiniTrend({ data }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="trend-chart">
      {data.map((d, i) => (
        <div key={i} className="trend-bar-wrap">
          <div
            className="trend-bar"
            style={{ height: `${(d.count / max) * 100}%`, background: "var(--cyan)" }}
            title={`${d.date}: ${d.count} tickets`}
          />
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getReports()
      .then(setData)
      .catch(err => setError(err.message || "Failed to load reports"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="page-stack">
        <div className="page-heading"><h1>Reports</h1></div>
        <div className="loading-state"><div className="spinner" /></div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-stack">
        <div className="page-heading"><h1>Reports</h1></div>
        <div className="alert alert-error">Error: {error}</div>
      </section>
    );
  }

  const {
    assetsByStatus, assetsByMinistry, ticketsByTeam, ticketsByStatus,
    ticketTrend, totals, usersByRole
  } = data;

  const maxAssetStatus = Math.max(...assetsByStatus.map(d => d.count), 1);
  const maxTicketStatus = Math.max(...ticketsByStatus.map(d => d.count), 1);
  const maxTeam = Math.max(...ticketsByTeam.map(d => d.count), 1);
  const maxMinistry = Math.max(...assetsByMinistry.map(d => d.count), 1);
  const maxRole = Math.max(...usersByRole.map(d => d.count), 1);

  const statusColors = {
    "Available": "var(--mint)",
    "Assigned": "var(--cyan)",
    "In Maintenance": "var(--amber)",
    "Retired": "var(--slate)",
    "Lost": "var(--coral)",
    "Damaged": "var(--coral)"
  };

  const ticketStatusColors = {
    "Open": "var(--coral)",
    "In Progress": "var(--cyan)",
    "Pending": "var(--amber)",
    "Resolved": "var(--mint)",
    "Closed": "var(--slate)"
  };

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1>Reports</h1>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="stat-grid">
        <div className="stat-card cyan">
          <div className="stat-header">
            <div className="stat-icon"><FiBox /></div>
            <div className="stat-label">Total Assets</div>
          </div>
          <div className="stat-value">{totals.totalAssets}</div>
          <div className="stat-change up">{totals.totalAssets} registered</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-header">
            <div className="stat-icon"><FiTool /></div>
            <div className="stat-label">Open Tickets</div>
          </div>
          <div className="stat-value">{totals.openTickets}</div>
          <div className="stat-change down">needs attention</div>
        </div>
        <div className="stat-card mint">
          <div className="stat-header">
            <div className="stat-icon"><FiClock /></div>
            <div className="stat-label">Resolved Tickets</div>
          </div>
          <div className="stat-value">{totals.resolvedTickets}</div>
          <div className="stat-change up">{totals.totalTickets} total</div>
        </div>
        <div className="stat-card coral">
          <div className="stat-header">
            <div className="stat-icon"><FiUsers /></div>
            <div className="stat-label">Teams</div>
          </div>
          <div className="stat-value">{ticketsByTeam?.length || 0}</div>
          <div className="stat-change">active teams</div>
        </div>
      </div>

      <div className="content-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Assets by Status */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Assets by Status</span>
          </div>
          <div style={{ padding: "14px 18px" }}>
            <BarChart
              data={assetsByStatus}
              color="var(--cyan)"
              maxVal={maxAssetStatus}
            />
          </div>
        </div>

        {/* Tickets by Status */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Tickets by Status</span>
          </div>
          <div style={{ padding: "14px 18px" }}>
            <BarChart
              data={ticketsByStatus}
              color="var(--amber)"
              maxVal={maxTicketStatus}
            />
          </div>
        </div>

        {/* Tickets by Team */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Tickets by Team</span>
          </div>
          <div style={{ padding: "14px 18px" }}>
            <BarChart
              data={ticketsByTeam}
              color="var(--mint)"
              maxVal={maxTeam}
            />
          </div>
        </div>

        {/* Assets by Ministry */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Assets by Ministry</span>
          </div>
          <div style={{ padding: "14px 18px" }}>
            <BarChart
              data={assetsByMinistry}
              color="var(--ocean)"
              maxVal={maxMinistry}
            />
          </div>
        </div>

        {/* Ticket Trend (last 30 days) */}
        <div className="panel" style={{ gridColumn: "1 / -1" }}>
          <div className="panel-header">
            <span className="panel-title">Ticket Creation Trend (Last 30 Days)</span>
          </div>
          <div style={{ padding: "14px 18px", display: "flex", alignItems: "flex-end", gap: 3, height: 120 }}>
            {ticketTrend.length === 0
              ? <div className="chart-empty" style={{ width: "100%" }}>No ticket data</div>
              : <MiniTrend data={ticketTrend} />
            }
          </div>
        </div>

        {/* Users by Role */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Users by Role</span>
          </div>
          <div style={{ padding: "14px 18px" }}>
            <BarChart
              data={usersByRole}
              color="var(--coral)"
              maxVal={maxRole}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
