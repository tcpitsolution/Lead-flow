import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

export default function ProfileModal({ onClose }) {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState("view"); // view | email | password
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", companyName: user?.companyName || "" });
  const [emailStep, setEmailStep] = useState(1); // 1=enter new email, 2=enter otp
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [msg, setMsg] = useState({ text: "", ok: true });
  const [loading, setLoading] = useState(false);

  const setError = (text) => setMsg({ text, ok: false });
  const setSuccess = (text) => setMsg({ text, ok: true });

  const saveProfile = async (e) => {
    e.preventDefault();
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone))
      return setError("Please enter a valid 10-digit mobile number");
    setLoading(true); setMsg({ text: "", ok: true });
    try {
      const res = await api("/auth/profile", { method: "PUT", body: { name: form.name, phone: form.phone, companyName: form.companyName } });
      updateUser(res.user);
      setSuccess("Profile updated successfully!");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const requestEmailOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg({ text: "", ok: true });
    try {
      await api("/auth/request-email-change", { method: "POST", body: { newEmail } });
      setEmailStep(2);
      setSuccess("OTP sent to " + newEmail);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const verifyEmailOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg({ text: "", ok: true });
    try {
      const res = await api("/auth/verify-email-change", { method: "POST", body: { newEmail, otp } });
      updateUser(res.user);
      setSuccess("Email changed! Please use new email to login next time.");
      setEmailStep(1); setNewEmail(""); setOtp("");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return setError("New passwords do not match");
    setLoading(true); setMsg({ text: "", ok: true });
    try {
      await api("/auth/change-password", { method: "PUT", body: { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword } });
      setSuccess("Password changed successfully!");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="pm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pm-modal">
        <div className="pm-header">
          <div className="pm-avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
          <div>
            <div className="pm-name">{user?.name}</div>
            <div className="pm-email-text">{user?.email}</div>
          </div>
          <button className="pm-close" onClick={onClose}>✕</button>
        </div>

        <div className="pm-tabs">
          {["view", "email", "password"].map((t) => (
            <button key={t} className={`pm-tab${tab === t ? " active" : ""}`} onClick={() => { setTab(t); setMsg({ text: "", ok: true }); }}>
              {t === "view" ? "Profile" : t === "email" ? "Change Email" : "Change Password"}
            </button>
          ))}
        </div>

        {msg.text && <p className={`pm-msg${msg.ok ? " ok" : ""}`}>{msg.text}</p>}

        {tab === "view" && (
          <form onSubmit={saveProfile} className="pm-form">
            <div className="pm-info-row"><span className="pm-label">Phone</span><span className="pm-val">{user?.phone}</span></div>
            <div className="pm-info-row"><span className="pm-label">Account Type</span><span className="pm-val">{user?.userType === "company_owner" ? "Company Owner" : "Freelancer"}</span></div>
            {user?.companyName && <div className="pm-info-row"><span className="pm-label">Company</span><span className="pm-val">{user.companyName}</span></div>}
            <hr className="pm-divider" />
            <label className="pm-field-label">Name</label>
            <input className="pm-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
            <label className="pm-field-label">Phone</label>
            <input className="pm-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="10-digit mobile" maxLength={10} />
            {user?.userType === "company_owner" && <>
              <label className="pm-field-label">Company Name</label>
              <input className="pm-input" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Company name" />
            </>}
            <button className="pm-btn" type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</button>
          </form>
        )}

        {tab === "email" && (
          <form onSubmit={emailStep === 1 ? requestEmailOtp : verifyEmailOtp} className="pm-form">
            <p className="pm-hint">Current email: <strong>{user?.email}</strong></p>
            <label className="pm-field-label">New Email</label>
            <input className="pm-input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Enter new email" disabled={emailStep === 2} />
            {emailStep === 2 && <>
              <label className="pm-field-label">OTP (sent to new email)</label>
              <input className="pm-input" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP" maxLength={6} />
              <button type="button" className="pm-link" onClick={() => { setEmailStep(1); setOtp(""); setMsg({ text: "", ok: true }); }}>← Change email</button>
            </>}
            <button className="pm-btn" type="submit" disabled={loading}>
              {loading ? "Please wait..." : emailStep === 1 ? "Send OTP" : "Verify & Change Email"}
            </button>
          </form>
        )}

        {tab === "password" && (
          <form onSubmit={changePassword} className="pm-form">
            <label className="pm-field-label">Current Password</label>
            <input className="pm-input" type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} placeholder="Current password" />
            <label className="pm-field-label">New Password</label>
            <input className="pm-input" type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} placeholder="Min 8 chars, letters + numbers" />
            <label className="pm-field-label">Confirm New Password</label>
            <input className="pm-input" type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} placeholder="Repeat new password" />
            <button className="pm-btn" type="submit" disabled={loading}>{loading ? "Changing..." : "Change Password"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
