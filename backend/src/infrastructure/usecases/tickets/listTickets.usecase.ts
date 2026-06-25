import { TicketRepository } from "../../repositories/tickets.repository.js";

export class ListTicketsUseCase {
    constructor(private readonly ticketRepository = new TicketRepository()) {}

    public async execute() {
        return await this.ticketRepository.listTickets()
    }
}
