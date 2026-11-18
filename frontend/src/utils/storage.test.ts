import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../types";
import { clearSession, readToken, readUser, saveSession, updateStoredUser } from "./storage";

function memoryStorage() {
  const data = new Map<string, string>();

  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

const user: User = { id: "u1", name: "Ana", email: "ana@empresa.com", role: "USER" };

describe("storage da sessão", () => {
  let local: ReturnType<typeof memoryStorage>;
  let session: ReturnType<typeof memoryStorage>;

  beforeEach(() => {
    local = memoryStorage();
    session = memoryStorage();
    vi.stubGlobal("localStorage", local);
    vi.stubGlobal("sessionStorage", session);
  });

  it("'lembrar de mim' guarda no localStorage", () => {
    saveSession("tok", user, true);

    expect(local.getItem("helpdesk_token")).toBe("tok");
    expect(session.getItem("helpdesk_token")).toBeNull();
    expect(readToken()).toBe("tok");
    expect(readUser()).toEqual(user);
  });

  it("sem 'lembrar de mim' guarda só na sessão da aba", () => {
    saveSession("tok", user, false);

    expect(local.getItem("helpdesk_token")).toBeNull();
    expect(session.getItem("helpdesk_token")).toBe("tok");
    expect(readToken()).toBe("tok");
  });

  it("um novo login substitui a sessão anterior nos dois lugares", () => {
    saveSession("antigo", user, true);
    saveSession("novo", user, false);

    expect(local.getItem("helpdesk_token")).toBeNull();
    expect(readToken()).toBe("novo");
  });

  it("atualizar o usuário mantém o armazenamento original", () => {
    saveSession("tok", user, false);
    updateStoredUser({ ...user, name: "Ana Souza" });

    expect(local.getItem("helpdesk_user")).toBeNull();
    expect(readUser()?.name).toBe("Ana Souza");
  });

  it("clearSession limpa os dois armazenamentos", () => {
    saveSession("tok", user, true);
    clearSession();

    expect(readToken()).toBeNull();
    expect(readUser()).toBeNull();
  });

  it("usuário salvo corrompido não quebra a leitura", () => {
    local.setItem("helpdesk_user", "{nao-e-json");

    expect(readUser()).toBeNull();
  });
});
