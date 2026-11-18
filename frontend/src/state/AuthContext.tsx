import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi, setUnauthorizedHandler, usersApi } from "../api/client";
import type { User } from "../types";
import { clearSession, readToken, readUser, saveSession, updateStoredUser } from "../utils/storage";

type LoginInput = {
  email: string;
  password: string;
  /** Mantém a sessão após fechar o navegador. */
  remember?: boolean;
};

type AuthContextValue = {
  isAdmin: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  login: (input: LoginInput) => Promise<User>;
  logout: () => void;
  token: string | null;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(readToken);
  const [user, setUser] = useState(readUser);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async ({ email, password, remember = true }: LoginInput) => {
    setLoading(true);

    try {
      const data = await authApi.login({ userEmail: email.trim(), password });

      saveSession(data.token, data.user, remember);
      setToken(data.token);
      setUser(data.user);

      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  // Token recusado pela API (expirado, usuário removido...): encerra a sessão também na interface,
  // para que a rota protegida redirecione ao login em vez de exibir telas com erro.
  useEffect(() => {
    setUnauthorizedHandler(logout);

    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Ao abrir o app com sessão salva, confirma o token e atualiza nome/perfil (podem ter mudado).
  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    usersApi
      .me()
      .then((freshUser) => {
        if (!cancelled) {
          updateStoredUser(freshUser);
          setUser(freshUser);
        }
      })
      .catch(() => {
        // 401 já foi tratado pelo interceptor; falhas de rede mantêm a sessão como está.
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      isAdmin: user?.role === "ADMIN",
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
