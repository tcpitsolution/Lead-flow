import { NavLink } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/images/logo.png";

const NAV = [
  { icon: "⊞", label: "Dashboard", to: "/dashboard", end: true },
  { icon: "⇄", label: "Leads", to: "/dashboard/leads" },
  { icon: "🔍", label: "Client Finder", to: "/dashboard/client-finder" },
  { icon: "🏢", label: "Companies", to: "/dashboard/companies" },
  { icon: "⏱", label: "Activities", to: "/dashboard/activities" },
  { icon: "✓", label: "Tasks", to: "/dashboard/tasks" },
];

export default function AppSidebar() {
  const { theme, toggle } = useTheme();
  const { isAdmin } = useAuth();

  return (
    <aside className="nx-sidebar">
      <div className="nx-logo">
        <div className="nx-logo-mark">
          <img src={logo} alt="LeadFlow" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 6 }} />
        </div>
      </div>
      <nav className="nx-nav">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nx-nav-btn${isActive ? " active" : ""}`}
            title={item.label}
          >
            <span>{item.icon}</span>
          </NavLink>
        ))}
        {!isAdmin && (
          <NavLink
            to="/dashboard/upgrade"
            className={({ isActive }) => `nx-nav-btn${isActive ? " active" : ""}`}
            title="Upgrade Plan"
          >
            <span>⚡</span>
          </NavLink>
        )}
        {isAdmin && (
          <NavLink
            to="/dashboard/admin"
            className={({ isActive }) => `nx-nav-btn${isActive ? " active" : ""}`}
            title="Admin Panel"
          >
            <span>🛡️</span>
          </NavLink>
        )}
      </nav>
      <div className="nx-sidebar-bottom">
        <button className="nx-nav-btn nx-theme-btn" onClick={toggle} title="Toggle theme">
          {theme === "dark" ? "☀" : "🌙"}
        </button>
      </div>
    </aside>
  );
}
