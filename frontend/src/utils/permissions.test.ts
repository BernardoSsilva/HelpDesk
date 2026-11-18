import { describe, expect, it } from "vitest";
import { canDeleteTicket, canEditTicket, isAdmin } from "./permissions";

const admin = { id: "admin", role: "ADMIN" as const };
const requester = { id: "req", role: "USER" as const };
const responsible = { id: "resp", role: "USER" as const };
const stranger = { id: "other", role: "USER" as const };
const ticket = { requesterId: "req", responsibleId: "resp" };

describe("permissions (espelham a política do backend)", () => {
  it("identifica administradores", () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(requester)).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });

  it("edição: administrador, solicitante e responsável", () => {
    expect(canEditTicket(admin, ticket)).toBe(true);
    expect(canEditTicket(requester, ticket)).toBe(true);
    expect(canEditTicket(responsible, ticket)).toBe(true);
    expect(canEditTicket(stranger, ticket)).toBe(false);
  });

  it("exclusão: somente administrador e solicitante", () => {
    expect(canDeleteTicket(admin, ticket)).toBe(true);
    expect(canDeleteTicket(requester, ticket)).toBe(true);
    expect(canDeleteTicket(responsible, ticket)).toBe(false);
    expect(canDeleteTicket(stranger, ticket)).toBe(false);
  });

  it("sem usuário autenticado ninguém edita nem exclui", () => {
    expect(canEditTicket(null, ticket)).toBe(false);
    expect(canDeleteTicket(undefined, ticket)).toBe(false);
  });

  it("ticket sem responsável não dá permissão a ninguém por engano", () => {
    expect(canEditTicket(stranger, { requesterId: "req", responsibleId: null })).toBe(false);
  });
});
