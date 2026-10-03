import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  const login = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  // server se taaza status (role, trial, paid, blocked)
  const refreshUser = useCallback(async () => {
    try {
      const data = await api("/auth/me");
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
    } catch {
      /* 401 ho to api.js khud logout karwa deta hai */
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem("token")) refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    window.addEventListener("auth:logout", logout);
    window.addEventListener("auth:locked", refreshUser);
    return () => {
      window.removeEventListener("auth:logout", logout);
      window.removeEventListener("auth:locked", refreshUser);
    };
  }, [logout, refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthed: !!token,
        isAdmin: user?.role === "admin",
        login,
        logout,
        refreshUser,
        updateUser: (newUser) => {
          localStorage.setItem("user", JSON.stringify(newUser));
          setUser(newUser);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
