import { useMemo, useState } from "react";

function safeParseStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return raw; // store plain strings (e.g., JWT tokens) as-is
    }
  } catch {
    return fallback;
  }
}

export default function useAuth() {
  const [token, setToken] = useState(() => safeParseStorage("token", null));
  const [user, setUser] = useState(() => safeParseStorage("user", null));

  const login = (nextToken, nextUser) => {
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return useMemo(
    () => ({ token, user, isAuthenticated: Boolean(token), login, logout }),
    [token, user]
  );
}
