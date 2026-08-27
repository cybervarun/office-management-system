import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FiBell,
  FiGrid,
  FiHardDrive,
  FiLogOut,
  FiMenu,
  FiSearch,
  FiSettings,
  FiShield,
  FiTool,
  FiUsers
} from "react-icons/fi";
import Button from "./ui/Button";

const navItems = [
  { label: "Dashboard", to: "/", icon: FiGrid },
  { label: "Inventory", to: "/inventory", icon: FiHardDrive },
  { label: "Tickets", to: "/tickets", icon: FiTool },
  { label: "Users", to: "/users", icon: FiUsers },
  { label: "Reports", to: "/reports", icon: FiShield },
  { label: "Settings", to: "/settings", icon: FiSettings }
];

export default function Layout({ onLogout, user, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className={`app-shell${mobileOpen ? ' mobile-sidebar-open' : ''}`}>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="sidebar-logo">OM</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              className="nav-item"
              end={item.to === "/"}
              key={item.to}
              title={item.label}
              to={item.to}
            >
              <item.icon aria-hidden="true" />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-footer">
          <div className="sidebar-avatar" title={user?.name || "Admin"}>
            {(user?.name || "A").slice(0, 1).toUpperCase()}
          </div>
          <button
            className="nav-item"
            title="Log out"
            onClick={onLogout}
            style={{ color: "var(--slate)", background: "none", border: "none", cursor: "pointer", width: 40, height: 40, borderRadius: 8, display: "grid", placeItems: "center" }}
          >
            <FiLogOut style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </aside>

      <div className="mobile-scrim" onClick={() => setMobileOpen(false)} role="presentation" />

      <div className="workspace">
        <header className="topbar">
          <button
            aria-label="Open navigation"
            className="mobile-menu-button"
            onClick={() => setMobileOpen(true)}
          >
            <FiMenu />
          </button>
          <div className="topbar-search">
            <FiSearch aria-hidden="true" />
            <input type="text" placeholder="Search assets, tickets, users… (Ctrl+K)" />
          </div>
          <div className="topbar-right">
            <button className="topbar-btn" title="Notifications">
              <FiBell />
              <span className="dot" />
            </button>
            <div className="topbar-avatar" title={user?.name || "Admin"}>
              {(user?.name || "A").slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}
