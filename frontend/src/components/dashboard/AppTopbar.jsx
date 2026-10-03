import { useRef, useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ProfileModal from "./ProfileModal";
import logo from "../../assets/images/logo.png";

export default function AppTopbar({ search, onSearch }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <header className="nx-topbar">
        <div className="nx-topbar-left">
          <Link to="/dashboard" className="nx-brand" style={{ textDecoration: "none" }}>
            <div className="nx-brand-icon">
              <img src={logo} alt="LeadFlow" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 6 }} />
            </div>
            <span className="nx-brand-name">LeadFlow</span>
          </Link>
          <nav className="nx-top-nav">
            <NavLink to="/dashboard" end className={({ isActive }) => `nx-top-link${isActive ? " nx-top-link-active" : ""}`}>Dashboard</NavLink>
            <NavLink to="/dashboard/leads" className={({ isActive }) => `nx-top-link${isActive ? " nx-top-link-active" : ""}`}>Leads</NavLink>
            <NavLink to="/dashboard/client-finder" className={({ isActive }) => `nx-top-link${isActive ? " nx-top-link-active" : ""}`}>Client Finder</NavLink>
            <NavLink to="/dashboard/companies" className={({ isActive }) => `nx-top-link${isActive ? " nx-top-link-active" : ""}`}>Companies</NavLink>
            <NavLink to="/dashboard/activities" className={({ isActive }) => `nx-top-link${isActive ? " nx-top-link-active" : ""}`}>Activities</NavLink>
            <NavLink to="/dashboard/tasks" className={({ isActive }) => `nx-top-link${isActive ? " nx-top-link-active" : ""}`}>Tasks</NavLink>
            {user?.role !== "admin" && (
              <NavLink to="/dashboard/upgrade" className={({ isActive }) => `nx-top-link${isActive ? " nx-top-link-active" : ""}`}>⚡ Upgrade</NavLink>
            )}
            {user?.role === "admin" && (
              <NavLink to="/dashboard/admin" className={({ isActive }) => `nx-top-link${isActive ? " nx-top-link-active" : ""}`}>🛡️ Admin</NavLink>
            )}
          </nav>
        </div>
        <div className="nx-topbar-right">
          {onSearch !== undefined && (
            <div className="nx-search-wrap">
              <span className="nx-search-icon">🔍</span>
              <input
                className="nx-search"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          )}
          <div className="nx-profile-wrap" ref={dropRef}>
            <button className="nx-avatar-btn" onClick={() => setOpen((v) => !v)} title="Profile">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </button>
            {open && (
              <div className="nx-profile-dropdown">
                <div className="nx-pd-info">
                  <div className="nx-pd-avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
                  <div className="nx-pd-details">
                    <div className="nx-pd-name">{user?.name}</div>
                    <div className="nx-pd-email">{user?.email}</div>
                    {user?.phone && <div className="nx-pd-phone">{user?.phone}</div>}
                  </div>
                </div>
                <div className="nx-pd-divider" />
                <button className="nx-pd-item" onClick={() => { setOpen(false); setShowProfile(true); }}>
                  <span>✏️</span> Edit Profile
                </button>
                <div className="nx-pd-divider" />
                <button className="nx-pd-item nx-pd-logout" onClick={logout}>
                  <span>🚪</span> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  );
}
