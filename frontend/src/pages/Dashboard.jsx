import { useEffect, useState } from "react";
import { FiBox, FiCheckCircle, FiClock, FiTool, FiPlus, FiList, FiUsers, FiFileText } from "react-icons/fi";
import Badge from "../components/ui/Badge";
import { getDashboardStats } from "../services/inventoryService";

function Sparkline({ data, color }) {
  const max = Math.max(...data);
  return (
    <div className={`sparkline ${color}`}>
      {data.map((v, i) => (
        <div key={i} className="bar" style={{ height: `${(v / max) * 100}%` }} />
      ))}
    </div>
  );
}

const sparkData = {
  cyan: [40, 65, 50, 80, 60, 90, 75, 95, 85, 100],
  mint: [60, 55, 70, 65, 80, 75, 90, 85, 95, 92],
  amber: [30, 35, 40, 38, 45, 50, 48, 55, 52, 60],
  coral: [20, 25, 22, 30, 28, 35, 32, 40, 38, 42]
};

function StatCard({ label, value, change, trend, color, icon: Icon }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-header">
        <div className="stat-icon"><Icon /></div>
        <div className="stat-label">{label}</div>
      </div>
      <div className="stat-value">{value}</div>
      <div className={`stat-change ${trend}`}>{change}</div>
      <Sparkline data={sparkData[color]} color={color} />
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(data => setStats(data))
      .catch(() => setStats({
        totalAssets: 0, assignedAssets: 0, availableAssets: 0,
        inMaintenance: 0, openTickets: 0,
        recentAssets: [], recentTickets: []
      }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section>
        <div className="page-heading"><h1>Dashboard</h1><p>Loading...</p></div>
        <div className="stat-grid">
          {[1,2,3,4].map(i => <div key={i} className="stat-card" style={{minHeight:100}} />)}
        </div>
      </section>
    );
  }

  const {
    totalAssets = 0, assignedAssets = 0, availableAssets = 0,
    inMaintenance = 0, openTickets = 0,
    recentAssets = [], recentTickets = []
  } = stats;

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Office Management System overview</p>
        </div>
      </div>

      <div className="status-strip">
        <span className="status-pill system">
          <span className="pulse" />
          System Operational
        </span>
        <span className="status-pill active-users">
          <span className="pulse" />
          {totalAssets} Assets Registered
        </span>
      </div>

      <div className="quick-actions">
        <div className="quick-action-card" onClick={() => { window.history.pushState({}, "", "/inventory"); window.dispatchEvent(new PopStateEvent("popstate")); }}>
          <div className="quick-action-icon" style={{ background: "var(--cyan)" }}><FiBox /></div>
          <span className="quick-action-label">Inventory</span>
          <p className="quick-action-desc">View & manage assets</p>
        </div>
        <div className="quick-action-card" onClick={() => { window.history.pushState({}, "", "/tickets"); window.dispatchEvent(new PopStateEvent("popstate")); }}>
          <div className="quick-action-icon" style={{ background: "var(--amber)" }}><FiList /></div>
          <span className="quick-action-label">Tickets</span>
          <p className="quick-action-desc">Open support tickets</p>
        </div>
        <div className="quick-action-card" onClick={() => { window.history.pushState({}, "", "/raise-ticket"); window.dispatchEvent(new PopStateEvent("popstate")); }}>
          <div className="quick-action-icon" style={{ background: "var(--mint)" }}><FiPlus /></div>
          <span className="quick-action-label">Raise Ticket</span>
          <p className="quick-action-desc">Submit new request</p>
        </div>
        <div className="quick-action-card" onClick={() => { window.history.pushState({}, "", "/users"); window.dispatchEvent(new PopStateEvent("popstate")); }}>
          <div className="quick-action-icon" style={{ background: "var(--coral)" }}><FiUsers /></div>
          <span className="quick-action-label">Users</span>
          <p className="quick-action-desc">Manage users</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Assets" value={totalAssets.toLocaleString()}
          change={`${assignedAssets} assigned`} trend="up" color="cyan" icon={FiBox} />
        <StatCard label="Available" value={availableAssets.toLocaleString()}
          change={`${Math.round((availableAssets/totalAssets)*100)}% of total`} trend="up" color="mint" icon={FiCheckCircle} />
        <StatCard label="Assigned" value={assignedAssets.toLocaleString()}
          change={`${inMaintenance} in maintenance`} trend="up" color="amber" icon={FiClock} />
        <StatCard label="Open Tickets" value={openTickets.toLocaleString()}
          change="Needs attention" trend="down" color="coral" icon={FiTool} />
      </div>

      <div className="content-grid">
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Recent Assets</span>
            <button className="panel-action" onClick={() => window.location.href = "/inventory"}>View all →</button>
          </div>
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Name</th>
                  <th>Assigned To</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAssets.length === 0
                  ? <tr key="empty"><td colSpan="5" style={{textAlign:'center',padding:'1rem',color:'var(--text-muted)'}}>No assets yet</td></tr>
                  : recentAssets.map((a) => (
                      <tr key={a.asset_id}>
                        <td><span className="mono">{a.asset_id}</span></td>
                        <td>{a.asset_description || a.make_brand_model || '—'}</td>
                        <td>{a.asset_user || '—'}</td>
                        <td>{[a.mdo_location, a.room, a.floor].filter(Boolean).join(', ') || '—'}</td>
                        <td><Badge tone={a.asset_current_status === 'Available' ? 'success' : a.asset_current_status === 'Assigned' ? 'info' : 'warning'}>{a.asset_current_status}</Badge></td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Recent Tickets</span>
            <button className="panel-action" onClick={() => window.location.href = "/tickets"}>View all →</button>
          </div>
          <div className="activity-list">
            {recentTickets.length === 0
              ? <div key="empty" style={{padding:'1rem',textAlign:'center',color:'var(--text-muted)'}}>No tickets yet</div>
              : recentTickets.map((t) => (
                  <div className="activity-item" key={t.id}>
                    <div className={`activity-icon ${t.status === 'Open' ? 'error' : t.status === 'In Progress' ? 'warn' : 'add'}`}>
                      <FiTool />
                    </div>
                    <div className="activity-body">
                      <div className="activity-text">{t.title}</div>
                      <div className="activity-time">{t.created_by_name || 'Unknown'} · <Badge tone={t.status === 'Open' ? 'warning' : t.status === 'In Progress' ? 'info' : 'success'}>{t.status}</Badge></div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}
