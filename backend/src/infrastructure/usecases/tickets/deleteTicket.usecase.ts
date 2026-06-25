import { TicketRepository } from "../../repositories/tickets.repository.js";

export class DeleteTicketUseCase {
    constructor(private readonly ticketRepository = new TicketRepository()) {}

    public async execute(id: string) {
        const ticket = await this.ticketRepository.findById(id)

        if (!ticket) {
            throw new Error("Ticket not found")
        }

        return await this.ticketRepository.deleteTicket(id)
    }
}
