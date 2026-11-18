import { ForbiddenError, NotFoundError } from "../../../domain/errors/domain.error.js";
import { canDeleteTicket, type Actor } from "../../../domain/policies/ticket.policy.js";
import { TicketRepository } from "../../repositories/tickets.repository.js";

type Input = {
    id: string;
    actor: Actor;
}

export class DeleteTicketUseCase {
    constructor(private readonly ticketRepository = new TicketRepository()) {}

    public async execute({ id, actor }: Input) {
        const ticket = await this.ticketRepository.findById(id)

        if (!ticket) {
            throw new NotFoundError("Ticket não encontrado")
        }

        if (!canDeleteTicket(actor, ticket)) {
            throw new ForbiddenError("Somente administradores ou o solicitante podem excluir este ticket")
        }

        return await this.ticketRepository.deleteTicket(id)
    }
}
