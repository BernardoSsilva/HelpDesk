import { TicketRepository } from "../../repositories/tickets.repository.js";

export class FindTicketsByRequesterIdUseCase {
    constructor(private readonly ticketRepository = new TicketRepository()) {}

    public async execute(requesterId: string) {
        return await this.ticketRepository.findByRequesterId(requesterId)
    }
}
