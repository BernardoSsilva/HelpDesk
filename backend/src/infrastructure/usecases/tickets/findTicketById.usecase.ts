import { NotFoundError } from "../../../domain/errors/domain.error.js";
import { TicketRepository } from "../../repositories/tickets.repository.js";

export class FindTicketByIdUseCase {
    constructor(private readonly ticketRepository = new TicketRepository()) {}

    public async execute(id: string) {
        const ticket = await this.ticketRepository.findById(id)

        if (!ticket) {
            throw new NotFoundError("Ticket não encontrado")
        }

        return ticket
    }
}
