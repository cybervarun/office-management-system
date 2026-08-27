import { useState } from "react";
import { FiMail, FiLock, FiShield } from "react-icons/fi";
import { login } from "../services/authService";
import Button from "../components/ui/Button";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      onLogin(data.token, data.user);
    } catch (err) {
      const validationMessage = err.response?.data?.details?.[0]?.msg;
      setError(validationMessage || err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-canvas">
      <svg className="login-grid" aria-hidden="true">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,212,255,0.06)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-mark">OM</div>
          <div className="login-logo-text">
            <div className="login-logo-title">Office Management</div>
            <div className="login-logo-sub">System v2035</div>
          </div>
        </div>

        <form onSubmit={submit} noValidate>
          <div className="field">
            <span>E-MAIL</span>
            <div className="field-input-with-icon">
              <FiMail />
              <input
                type="email"
                placeholder="admin@agency.gov"
                value={form.email}
                required
                autoComplete="username"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="field">
            <span>PASSWORD</span>
            <div className="field-input-with-icon">
              <FiLock />
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                required
                autoComplete="current-password"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="login-error">
              <FiShield />
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" className="login-submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <div className="login-footer">
          <span>Authorized personnel only</span>
          <span className="mono">v2035.1.0</span>
        </div>
      </div>
    </div>
  );
}
