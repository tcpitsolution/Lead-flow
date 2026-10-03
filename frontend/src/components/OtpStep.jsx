import { useEffect, useState } from "react";
import { api } from "../api";

export default function OtpStep({ email, purpose, label, onSubmit, onBack }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(60);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) return setError("Please enter a valid 6-digit OTP");
    setBusy(true);
    setError("");
    try {
      await onSubmit(otp);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError("");
    setInfo("");
    try {
      await api("/auth/resend-otp", {
        method: "POST",
        auth: false,
        body: { email, purpose },
      });
      setInfo("A new OTP has been sent");
      setWait(60);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <p className="sub">
        A 6-digit OTP has been sent to <b>{email}</b>. Please check your spam
        folder too.
      </p>

      <div className="field">
        <label htmlFor="otp">OTP</label>
        <input
          id="otp"
          className="otp-input"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder="••••••"
          autoFocus
        />
      </div>

      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}
      {info && <p className="ok">{info}</p>}

      <button className="btn btn-full" type="submit" disabled={busy}>
        {busy ? "Verifying..." : label}
      </button>

      <p className="alt">
        {wait > 0 ? (
          <span>Resend OTP in {wait} seconds</span>
        ) : (
          <button type="button" className="link-btn" onClick={resend}>
            Resend OTP
          </button>
        )}
        {" · "}
        <button type="button" className="link-btn" onClick={onBack}>
          Go back
        </button>
      </p>
    </form>
  );
}
