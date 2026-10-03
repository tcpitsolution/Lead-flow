import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import OtpStep from "../../components/OtpStep";
import SEO from "../../components/SEO";
import "../../components/public/Pages.css";

export default function Login() {
  const { isAuthed, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/dashboard";

  const [step, setStep] = useState("creds"); // creds | otp
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  if (isAuthed) return <Navigate to="/dashboard" replace />;

  const cleanEmail = email.trim().toLowerCase();

  const submit = async (e) => {
    e.preventDefault();
    if (!cleanEmail || !password) return setError("Email aur password daalo");

    setBusy(true);
    setError("");
    try {
      await api("/auth/login", {
        method: "POST",
        auth: false,
        body: { email: cleanEmail, password },
      });
      setStep("otp");
    } catch (err) {
      if (err.data?.needsVerification) {
        // email verify nahi tha, server ne naya OTP bhej diya
        navigate("/signup", { state: { verifyEmail: err.data.email } });
        return;
      }
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <SEO
        title="Log In to LeadFlow"
        description="Sign in to your LeadFlow CRM account to manage leads, track your sales pipeline, and follow up with prospects."
        canonical="/login"
        noindex
      />
      <div className="auth box">
        {step === "creds" ? (
          <>
            <h1>Welcome back</h1>
            <p className="sub">Sign in to your LeadFlow account.</p>
            <form onSubmit={submit} noValidate>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="pw-wrap">
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    autoComplete="current-password"
                  />
                  <button type="button" className="pw-eye" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              {error && (
                <p className="err" role="alert">
                  {error}
                </p>
              )}
              <button className="btn btn-full" type="submit" disabled={busy}>
                {busy ? "Sending OTP..." : "Log in"}
              </button>
            </form>
            <p className="alt">
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
          </>
        ) : (
          <>
            <h1>Verify your login</h1>
            <OtpStep
              email={cleanEmail}
              purpose="login"
              label="Log in"
              onBack={() => setStep("creds")}
              onSubmit={async (otp) => {
                const data = await api("/auth/verify-login", {
                  method: "POST",
                  auth: false,
                  body: { email: cleanEmail, otp },
                });
                login(data.token, data.user);
                navigate(redirectTo, { replace: true });
              }}
            />
          </>
        )}
      </div>
    </main>
  );
}
