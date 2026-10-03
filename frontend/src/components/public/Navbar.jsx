import { ArrowUpRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/images/logo.png";

const Navbar = () => {
  const { isAuthed, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="brand">
          <img src={logo} alt="LeadFlow" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 6 }} />
          <span className="brand-name">LeadFlow</span>
        </Link>

        {/* Navigation */}
        <nav className="nav-links">
          <Link to="/features">Features</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/testimonials">Testimonials</Link>
          <Link to="/blogs">Blogs</Link>
          <Link to="/contact">Contact</Link>
        </nav>

        {/* Actions */}
        <div className="nav-actions">
          {isAuthed ? (
            <>
              <Link to="/dashboard" className="login-link">
                Dashboard
              </Link>

              <button type="button" className="nav-cta" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="login-link">
                Login
              </Link>

              <Link to="/signup" className="nav-cta">
                Get Started
                <ArrowUpRight size={16} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
