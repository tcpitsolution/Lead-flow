import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import OtpStep from "../../components/OtpStep";
import SEO from "../../components/SEO";
import "../../components/public/Pages.css";

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const normPhone = (v) =>
  v
    .trim()
    .replace(/[\s-]/g, "")
    .replace(/^(\+91|91|0)(?=\d{10}$)/, "");

export default function Signup() {
  const { isAuthed } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const verifyEmail = location.state?.verifyEmail; // login se aaye the aur email verify nahi tha

  const [step, setStep] = useState(verifyEmail ? "otp" : "form"); // form | otp | done
  const [form, setForm] = useState({
    name: "",
    email: verifyEmail || "",
    phone: "",
    userType: "",
    companyName: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const email = form.email.trim().toLowerCase();

  // signup ho gaya: 2 second baad login page
  useEffect(() => {
    if (step !== "done") return;
    const t = setTimeout(
      () => navigate("/login", { replace: true, state: { email } }),
      2000,
    );
    return () => clearTimeout(t);
  }, [step, navigate, email]);

  if (isAuthed) return <Navigate to="/dashboard" replace />;

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (form.name.trim().length < 2) return "Please enter your full name";
    if (!emailRx.test(email)) return "Please enter a valid email";
    if (!/^[6-9]\d{9}$/.test(normPhone(form.phone)))
      return "Please enter a valid 10-digit mobile number";
    if (!form.userType) return "Please select Freelancer or Company owner";
    if (form.userType === "company_owner" && form.companyName.trim().length < 2)
      return "Please enter your company name";
    if (
      form.password.length < 8 ||
      !/[A-Za-z]/.test(form.password) ||
      !/\d/.test(form.password)
    )
      return "Password must be at least 8 characters with letters and numbers";
    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) return setError(msg);

    setBusy(true);
    setError("");
    try {
      await api("/auth/signup", {
        method: "POST",
        auth: false,
        body: {
          name: form.name.trim(),
          email,
          phone: normPhone(form.phone),
          userType: form.userType,
          ...(form.userType === "company_owner" && {
            companyName: form.companyName.trim(),
          }),
          password: form.password,
        },
      });
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <SEO
        title="Sign Up Free - Start Managing Leads with LeadFlow"
        description="Create your free LeadFlow account. No credit card required. Start managing leads, tracking your sales pipeline, and closing more deals today."
        canonical="/signup"
        noindex
      />
      <div className="auth box">
        {step === "form" && (
          <>
            <h1>Create a free account</h1>
            <p className="sub">14-day free trial. No credit card required.</p>
            <form onSubmit={submit} noValidate>
              <div className="field">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={change}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={change}
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="10-digit mobile number"
                  autoComplete="tel"
                  maxLength={10}
                />
              </div>
              <div className="field">
                <label htmlFor="userType">I am a...</label>
                <select
                  id="userType"
                  name="userType"
                  value={form.userType}
                  onChange={change}
                >
                  <option value="">Select...</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="company_owner">Company Owner</option>
                </select>
              </div>
              {form.userType === "company_owner" && (
                <div className="field">
                  <label htmlFor="companyName">Company Name</label>
                  <input
                    id="companyName"
                    name="companyName"
                    value={form.companyName}
                    onChange={change}
                    placeholder="Your company"
                  />
                </div>
              )}
              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="pw-wrap">
                  <input
                    id="password"
                    name="password"
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={change}
                    placeholder="8+ characters with letters and numbers"
                    autoComplete="new-password"
                  />
                  <button type="button" className="pw-eye" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
                <span className="hint">
                  At least 8 characters with both letters and numbers
                </span>
              </div>

              {error && (
                <p className="err" role="alert">
                  {error}
                </p>
              )}
              <button className="btn btn-full" type="submit" disabled={busy}>
                {busy ? "Sending OTP..." : "Sign up"}
              </button>
            </form>
            <p className="alt">
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </>
        )}

        {step === "otp" && (
          <>
            <h1>Verify your email</h1>
            <OtpStep
              email={email}
              purpose="signup"
              label="Verify"
              onBack={() => setStep("form")}
              onSubmit={async (otp) => {
                await api("/auth/verify-signup", {
                  method: "POST",
                  auth: false,
                  body: { email, otp },
                });
                setStep("done");
              }}
            />
          </>
        )}

        {step === "done" && (
          <div className="success-box">
            <h1>Account created!</h1>
            <p className="sub">
              Your account is ready. Redirecting to login...
            </p>
            <Link to="/login" state={{ email }} className="btn btn-full">
              Log in now
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
