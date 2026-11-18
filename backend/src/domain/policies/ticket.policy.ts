import { UserRoleEnum } from "../enums/userRole.enum.js";

/**
 * Regras de autorização sobre tickets.
 *
 * - Todo usuário autenticado pode ler tickets e comentar (fila compartilhada).
 * - Editar: administradores, o solicitante e o responsável atual.
 * - Excluir: administradores e o solicitante (a exclusão apaga o histórico).
 * - Criar em nome de outra pessoa: somente administradores.
 *
 * O frontend replica estas regras em `src/utils/permissions.ts` apenas para
 * esconder/desabilitar ações; a garantia real é feita aqui.
 */
export type Actor = {
    id: string;
    role: string;
};

export type TicketOwnership = {
    requesterId: string;
    responsibleId: string | null;
};

export function isAdmin(actor: Actor) {
    return actor.role === UserRoleEnum.ADMIN;
}

export function canEditTicket(actor: Actor, ticket: TicketOwnership) {
    return isAdmin(actor) || ticket.requesterId === actor.id || ticket.responsibleId === actor.id;
}

export function canDeleteTicket(actor: Actor, ticket: TicketOwnership) {
    return isAdmin(actor) || ticket.requesterId === actor.id;
}

export function canCreateTicketFor(actor: Actor, requesterId: string) {
    return isAdmin(actor) || requesterId === actor.id;
}
