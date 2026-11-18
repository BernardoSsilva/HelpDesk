import type { Ticket, User } from "../types";

// Espelham as regras do backend (backend/src/domain/policies/ticket.policy.ts).
// Servem só para esconder/desabilitar ações; quem garante a permissão é a API.

type Actor = Pick<User, "id" | "role"> | null | undefined;
type TicketOwnership = Pick<Ticket, "requesterId" | "responsibleId">;

export function isAdmin(user: Actor) {
  return user?.role === "ADMIN";
}

/** Administradores, o solicitante e o responsável atual podem alterar o ticket. */
export function canEditTicket(user: Actor, ticket: TicketOwnership) {
  return Boolean(user) && (isAdmin(user) || ticket.requesterId === user?.id || ticket.responsibleId === user?.id);
}

/** Administradores e o solicitante podem excluir o ticket. */
export function canDeleteTicket(user: Actor, ticket: TicketOwnership) {
  return Boolean(user) && (isAdmin(user) || ticket.requesterId === user?.id);
}
