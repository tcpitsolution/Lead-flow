import { useEffect, useState } from "react";

const CURRENCIES = ["USD","INR","EUR","GBP","AED","SGD","AUD","CAD","JPY","CNY"];

const EMPTY = {
  name: "", company: "", phone: "", email: "", workEmail: "",
  linkedinId: "", instagramId: "", facebookId: "", twitterId: "",
  websiteUrl: "", problemNote: "", conversionStartDate: "",
  dealAmount: "", dealCurrency: "USD",
  source: "manual", stage: "", stageNote: "",
  status: "new", followUpDate: "",
};

export default function LeadModal({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();

    const body = {};
    for (const [k, v] of Object.entries(form)) {
      const t = typeof v === "string" ? v.trim() : v;
      if (t !== "") body[k] = t;
    }

    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(body.email))
      return setError("Please enter a valid email address");
    if (body.workEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(body.workEmail))
      return setError("Please enter a valid work email address");
    if (body.phone && !/^[6-9]\d{9}$/.test(body.phone))
      return setError("Please enter a valid 10-digit mobile number");
    if (body.dealAmount !== undefined) {
      body.dealAmount = Number(body.dealAmount);
      if (Number.isNaN(body.dealAmount) || body.dealAmount < 0)
        return setError("Deal amount must be a valid positive number");
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
          <button type="button" className="dx-x" onClick={onClose} aria-label="Band karo">×</button>
        </div>

        <div className="dx-form-grid">
          {/* Basic Info */}
          <label className="dx-field dx-full">
            Name
            <input name="name" value={form.name} onChange={change} autoFocus placeholder="Lead name (optional)" />
          </label>
          <label className="dx-field">
            Company
            <input name="company" value={form.company} onChange={change} placeholder="Company name" />
          </label>
          <label className="dx-field">
            Phone
            <input
              name="phone" type="tel" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              placeholder="10-digit mobile number" maxLength={10}
            />
          </label>
          <label className="dx-field">
            Email
            <input name="email" type="email" value={form.email} onChange={change} placeholder="example@domain.com" />
          </label>
          <label className="dx-field">
            Work Email
            <input name="workEmail" type="email" value={form.workEmail} onChange={change} placeholder="work@company.com" />
          </label>

          {/* Social / Web */}
          <label className="dx-field">
            LinkedIn ID
            <input name="linkedinId" value={form.linkedinId} onChange={change} placeholder="linkedin.com/in/username" />
          </label>
          <label className="dx-field">
            Instagram ID
            <input name="instagramId" value={form.instagramId} onChange={change} placeholder="@username" />
          </label>
          <label className="dx-field">
            Facebook ID
            <input name="facebookId" value={form.facebookId} onChange={change} placeholder="facebook.com/username" />
          </label>
          <label className="dx-field">
            Twitter / X ID
            <input name="twitterId" value={form.twitterId} onChange={change} placeholder="@username" />
          </label>
          <label className="dx-field">
            Website URL
            <input name="websiteUrl" value={form.websiteUrl} onChange={change} placeholder="https://example.com" />
          </label>

          {/* Deal */}
          <label className="dx-field">
            Deal Amount
            <div style={{ display: "flex", gap: "6px" }}>
              <select name="dealCurrency" value={form.dealCurrency} onChange={change} style={{ width: "90px" }}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                name="dealAmount" type="number" min="0" value={form.dealAmount}
                onChange={change} placeholder="0" style={{ flex: 1 }}
              />
            </div>
          </label>

          {/* Stage */}
          <label className="dx-field">
            Stage
            <select name="stage" value={form.stage} onChange={change}>
              <option value="">-- Select Stage --</option>
              <option value="website-seo">Website SEO</option>
              <option value="other">Other</option>
            </select>
          </label>
          {form.stage === "other" && (
            <label className="dx-field dx-full">
              Stage Details
              <textarea
                name="stageNote" value={form.stageNote} onChange={change}
                placeholder="Describe the stage..." rows={3}
              />
            </label>
          )}

          {/* Source & Status */}
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
            Status
            <select name="status" value={form.status} onChange={change}>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </label>

          {/* Dates */}
          <label className="dx-field">
            Follow-up Date
            <input name="followUpDate" type="date" value={form.followUpDate} onChange={change} />
          </label>
          <label className="dx-field">
            Conversion Start Date
            <input name="conversionStartDate" type="date" value={form.conversionStartDate} onChange={change} />
          </label>

          {/* Problem Note */}
          <label className="dx-field dx-full">
            Problem / Notes
            <textarea
              name="problemNote" value={form.problemNote} onChange={change}
              placeholder="Any problem or notes about this lead..." rows={3}
            />
          </label>
        </div>

        {error && <p className="dx-err" role="alert">{error}</p>}

        <div className="dx-modal-foot">
          <button type="button" className="dx-btn dx-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="dx-btn" disabled={saving}>
            {saving ? "Saving..." : "Save Lead"}
          </button>
        </div>
      </form>
    </div>
  );
}
