import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { authApi } from "../api/client";
import type { User } from "../types";

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  loading: boolean;
  login: (input: LoginInput) => Promise<User>;
  logout: () => void;
  token: string | null;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): User | null {
  const rawUser = localStorage.getItem("helpdesk_user");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem("helpdesk_token"));
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async ({ email, password }: LoginInput) => {
    setLoading(true);

    try {
      const data = await authApi.login({ userEmail: email, password });

      localStorage.setItem("helpdesk_token", data.token);
      localStorage.setItem("helpdesk_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);

      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("helpdesk_token");
    localStorage.removeItem("helpdesk_user");
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      loading,
      login,
      logout,
      token,
      user,
    }),
    [loading, login, logout, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}
