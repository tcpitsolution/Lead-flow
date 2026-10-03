import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { AuthProvider } from "../src/context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import useAnimate from "./hooks/useAnimate";
import ProtectedRoute from "./components/ProtectedRoute";

import Navbar from "./components/public/Navbar";
import Footer from "./components/public/Footer";

import Home from "../src/pages/public/Home";
import Features from "./pages/public/Features";
import Pricing from "./pages/public/Pricing";
import AdminPanel from "./components/dashboard/AdminPanel";
import Testimonials from "./pages/public/Testimonials";
import Blogs from "./pages/public/Blogs";
import Contact from "./pages/public/Contact";
import Login from "./pages/public/Login";
import Signup from "./pages/public/Signup";
import Dashboard from "./components/dashboard/Dashboard";
import Companies from "./components/dashboard/Companies";
import Activities from "./components/dashboard/Activities";
import Tasks from "./components/dashboard/Tasks";
import Leads from "./components/dashboard/Leads";
import ClientFinder from "./components/dashboard/ClientFinder";
import Upgrade from "./components/dashboard/Upgrade";

function AnimationInit() {
  useAnimate();
  return null;
}

const DASHBOARD_ROUTES = ["/dashboard"];

function Layout({ children }) {
  const { pathname } = useLocation();
  const { theme, applyTheme } = useTheme();
  const isDashboard = DASHBOARD_ROUTES.some((r) => pathname.startsWith(r));

  useEffect(() => {
    applyTheme(theme, isDashboard);
  }, [theme, isDashboard]);

  return (
    <div className={isDashboard ? undefined : "site"}>
      <AnimationInit />
      {isDashboard && (
        <Helmet>
          <meta name="robots" content="noindex,nofollow" />
        </Helmet>
      )}
      {!isDashboard && <Navbar />}
      {children}
      {!isDashboard && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/leads"
              element={
                <ProtectedRoute>
                  <Leads />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/companies"
              element={
                <ProtectedRoute>
                  <Companies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/activities"
              element={
                <ProtectedRoute>
                  <Activities />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/tasks"
              element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/client-finder"
              element={
                <ProtectedRoute>
                  <ClientFinder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/upgrade"
              element={
                <ProtectedRoute>
                  <Upgrade />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </AuthProvider>
    </ThemeProvider>
  );
}
