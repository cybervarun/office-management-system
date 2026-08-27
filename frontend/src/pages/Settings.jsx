import { useEffect, useState } from "react";
import { FiSave, FiBell, FiShield, FiSettings } from "react-icons/fi";
import { getSettings, updateNotifications } from "../services/settingsService";

export default function Settings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    ticketAssignments: true,
    assetStatusChanges: false,
    weeklyDigest: true,
    securityAlerts: true
  });

  useEffect(() => {
    getSettings()
      .then(res => {
        setData(res);
        setNotifications(prev => ({ ...prev, ...res.notifications }));
      })
      .catch(err => setError(err.message || "Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateNotifications(notifications);
      setSaved(true);
    } catch (err) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="page-stack">
        <div className="page-heading"><h1>Settings</h1></div>
        <div className="loading-state"><div className="spinner" /></div>
      </section>
    );
  }

  const notifItems = [
    { key: "emailAlerts", label: "Email Alerts", desc: "Receive email notifications for critical events" },
    { key: "ticketAssignments", label: "Ticket Assignments", desc: "Get notified when a ticket is assigned to you" },
    { key: "assetStatusChanges", label: "Asset Status Changes", desc: "Alert on asset status updates (Available, Retired, etc.)" },
    { key: "weeklyDigest", label: "Weekly Digest", desc: "Receive a weekly summary of system activity" },
    { key: "securityAlerts", label: "Security Alerts", desc: "Immediate alerts for security-related events" }
  ];

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Settings</h1>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {saved && <div className="toast"><span>Settings saved successfully</span><button onClick={() => setSaved(false)}>×</button></div>}

      {/* Notification Preferences */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title"><FiBell /> Notification Preferences</span>
        </div>
        <div style={{ padding: "4px 0" }}>
          {notifItems.map(item => (
            <div key={item.key} className="setting-row">
              <div className="setting-info">
                <div className="setting-label">{item.label}</div>
                <div className="setting-desc">{item.desc}</div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={notifications[item.key]}
                  onChange={() => handleToggle(item.key)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 18px", borderTop: "1px solid var(--ice-dim)", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <FiSave /> {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Role Policies */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title"><FiShield /> Role Policies</span>
        </div>
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Users</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {(data?.roles || []).map(role => {
                const roleData = data?.roleStats?.find(r => r.role === role);
                const descriptions = {
                  Admin: "Full system access, including user management and settings",
                  "Help Desk": "Create and manage tickets, view inventory",
                  "IT Team": "Manage assets, update ticket status",
                  "Network Team": "Network asset management and ticket support",
                  Cybersecurity: "Security alerts, asset compliance monitoring"
                };
                return (
                  <tr key={role}>
                    <td><Badge tone={role === "Admin" ? "warning" : "info"}>{role}</Badge></td>
                    <td><span className="mono">{roleData?.count || 0}</span></td>
                    <td style={{ color: "var(--slate-dim)", fontSize: 12 }}>{descriptions[role] || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Info */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title"><FiSettings /> System Information</span>
        </div>
        <div style={{ padding: "14px 18px", display: "grid", gap: 8 }}>
          {[
            ["Version", data?.systemInfo?.version || "1.0.0"],
            ["Environment", data?.systemInfo?.environment || "development"],
            ["Active Teams", data?.systemInfo?.maxTeams || 0],
            ["Defined Roles", data?.systemInfo?.maxRoles || 0]
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--ice-dim)", fontSize: 13 }}>
              <span style={{ color: "var(--slate-dim)", fontFamily: "var(--font-mono)", textTransform: "uppercase", fontSize: 11, letterSpacing: "0.06em" }}>{label}</span>
              <span style={{ fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Badge({ children, tone = "neutral" }) {
  return (
    <span className={`badge badge-${tone}`}>
      <span className="dot" />
      {children}
    </span>
  );
}
