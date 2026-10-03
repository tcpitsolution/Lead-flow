import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AccountLocked from "./AccountLocked";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthed, user } = useAuth();
  const location = useLocation();

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // trial khatam ya block: dashboard ki jagah lock screen
  const status = user?.access?.status;
  if (!adminOnly && (status === "blocked" || status === "expired")) {
    return <AccountLocked access={user.access} />;
  }

  return children;
}
