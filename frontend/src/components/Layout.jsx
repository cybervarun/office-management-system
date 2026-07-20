import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FiBell,
  FiChevronLeft,
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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const shellClass = [
    "app-shell",
    collapsed ? "sidebar-collapsed" : "",
    mobileOpen ? "mobile-sidebar-open" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClass}>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand-block">
          <div className="brand-mark">IT</div>
          <div className="brand-copy">
            <strong>Office IT</strong>
            <span>Inventory and Service Desk</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink className="nav-item" end={item.to === "/"} key={item.to} title={item.label} to={item.to}>
              <item.icon aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-card">
            <div className="avatar">{(user?.name || "Admin").slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{user?.name || "System Admin"}</strong>
              <span>{user?.role || "Administrator"}</span>
            </div>
          </div>
          <Button icon={FiLogOut} onClick={onLogout} variant="sidebar">
            Logout
          </Button>
        </div>
      </aside>

      <div className="mobile-scrim" onClick={() => setMobileOpen(false)} role="presentation" />

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <Button
              aria-label="Open navigation"
              className="mobile-menu-button"
              icon={FiMenu}
              onClick={() => setMobileOpen(true)}
              size="icon"
              variant="ghost"
            >
              Menu
            </Button>
            <Button
              aria-label="Collapse sidebar"
              className="desktop-collapse-button"
              icon={collapsed ? FiMenu : FiChevronLeft}
              onClick={() => setCollapsed((value) => !value)}
              size="icon"
              variant="ghost"
            >
              Toggle
            </Button>
            <div className="topbar-title">
              <span>Government IT Operations</span>
              <strong>Asset and Ticket Management</strong>
            </div>
          </div>

          <label className="global-search" htmlFor="global-search">
            <FiSearch aria-hidden="true" />
            <input id="global-search" placeholder="Search assets, tickets, users" />
          </label>

          <div className="topbar-actions">
            <Button aria-label="Notifications" className="notification-button" icon={FiBell} size="icon" variant="ghost">
              Notifications
            </Button>
            <div className="topbar-profile">
              <div className="avatar avatar-small">{(user?.name || "A").slice(0, 1).toUpperCase()}</div>
              <div>
                <strong>{user?.name || "Admin"}</strong>
                <span>{user?.role || "Admin"}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}
