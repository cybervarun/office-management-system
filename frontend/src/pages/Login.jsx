import { useState } from "react";
import { login } from "../services/authService";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await login(form.email, form.password);
      onLogin(data.token, data.user);
    } catch (err) {
      const validationMessage = err.response?.data?.details?.[0]?.msg;
      setError(validationMessage || err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="centered">
      <form className="card" onSubmit={submit}>
        <h1>Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          required
          autoComplete="username"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          required
          autoComplete="current-password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit">Sign In</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
