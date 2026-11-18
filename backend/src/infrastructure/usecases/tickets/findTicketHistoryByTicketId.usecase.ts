import { NotFoundError } from "../../../domain/errors/domain.error.js";
import { TicketHistoryRepository } from "../../repositories/ticketHistory.repository.js";
import { TicketRepository } from "../../repositories/tickets.repository.js";

export class FindTicketHistoryByTicketIdUseCase {
    constructor(
        private readonly ticketHistoryRepository = new TicketHistoryRepository(),
        private readonly ticketRepository = new TicketRepository(),
    ) {}

    public async execute(ticketId: string) {
        if (!(await this.ticketRepository.findById(ticketId))) {
            throw new NotFoundError("Ticket não encontrado")
        }

        return await this.ticketHistoryRepository.findByTicketId(ticketId)
    }
}
