import { useEffect, useState } from "react";

const EMPTY = {
  name: "",
  company: "",
  phone: "",
  email: "",
  value: "",
  source: "manual",
  followUpDate: "",
};

export default function LeadModal({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Esc dabane par band
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Please enter lead name");

    const body = {};
    for (const [k, v] of Object.entries(form)) {
      const t = typeof v === "string" ? v.trim() : v;
      if (t !== "") body[k] = t;
    }
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(body.email))
      return setError("Please enter a valid email address");
    if (body.phone && !/^[6-9]\d{9}$/.test(body.phone))
      return setError("Please enter a valid 10-digit mobile number");
    if (body.value !== undefined) {
      body.value = Number(body.value);
      if (Number.isNaN(body.value) || body.value < 0)
        return setError("Deal value must be a valid positive number");
    }

    setSaving(true);
    setError("");
    try {
      await onSave(body);
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="dx-overlay" onClick={onClose}>
      <form
        className="dx-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-label="Nayi lead"
      >
        <div className="dx-modal-head">
          <h2>Add New Lead</h2>
          <button
            type="button"
            className="dx-x"
            onClick={onClose}
            aria-label="Band karo"
          >
            ×
          </button>
        </div>

        <div className="dx-form-grid">
          <label className="dx-field dx-full">
            Name *
            <input name="name" value={form.name} onChange={change} autoFocus placeholder="Lead name" />
          </label>
          <label className="dx-field">
            Company
            <input name="company" value={form.company} onChange={change} />
          </label>
          <label className="dx-field">
            Phone
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              placeholder="10-digit mobile number"
              maxLength={10}
            />
          </label>
          <label className="dx-field">
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={change}
              placeholder="example@domain.com"
            />
          </label>
          <label className="dx-field">
            Deal value (₹)
            <input
              name="value"
              type="number"
              min="0"
              value={form.value}
              onChange={change}
            />
          </label>
          <label className="dx-field">
            Source
            <select name="source" value={form.source} onChange={change}>
              <option value="manual">Manual</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="call">Call</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="dx-field">
            Follow-up date
            <input
              name="followUpDate"
              type="date"
              value={form.followUpDate}
              onChange={change}
            />
          </label>
        </div>

        {error && (
          <p className="dx-err" role="alert">
            {error}
          </p>
        )}

        <div className="dx-modal-foot">
          <button
            type="button"
            className="dx-btn dx-btn-ghost"
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className="dx-btn" disabled={saving}>
            {saving ? "Saving..." : "Save Lead"}
          </button>
        </div>
      </form>
    </div>
  );
}
