const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Could not connect to server. Is the backend running?");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // token expired or invalid: log out
    if (res.status === 401 && auth) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("auth:logout"));
    }
    // trial khatam ya account block: AuthContext ko batao
    if (
      res.status === 403 &&
      auth &&
      (data.code === "TRIAL_EXPIRED" || data.code === "ACCOUNT_BLOCKED")
    ) {
      window.dispatchEvent(new Event("auth:locked"));
    }
    const err = new Error(
      data.message || "Something went wrong, please try again",
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
