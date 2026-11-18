import type { User } from "../types";

const TOKEN_KEY = "helpdesk_token";
const USER_KEY = "helpdesk_user";

// "Lembrar de mim" guarda a sessão no localStorage (sobrevive ao fechar o navegador);
// sem ele, a sessão fica no sessionStorage e termina quando a aba é fechada.
function stores() {
  return [localStorage, sessionStorage];
}

export function readToken(): string | null {
  for (const store of stores()) {
    const token = store.getItem(TOKEN_KEY);

    if (token) {
      return token;
    }
  }

  return null;
}

export function readUser(): User | null {
  for (const store of stores()) {
    const raw = store.getItem(USER_KEY);

    if (raw) {
      try {
        return JSON.parse(raw) as User;
      } catch {
        return null;
      }
    }
  }

  return null;
}

export function saveSession(token: string, user: User, remember: boolean) {
  clearSession();

  const store = remember ? localStorage : sessionStorage;

  store.setItem(TOKEN_KEY, token);
  store.setItem(USER_KEY, JSON.stringify(user));
}

/** Atualiza o usuário guardado mantendo onde a sessão já estava salva. */
export function updateStoredUser(user: User) {
  const store = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;

  store.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  for (const store of stores()) {
    store.removeItem(TOKEN_KEY);
    store.removeItem(USER_KEY);
  }
}
