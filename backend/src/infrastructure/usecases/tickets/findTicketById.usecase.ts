import { TicketRepository } from "../../repositories/tickets.repository.js";

export class FindTicketByIdUseCase {
    constructor(private readonly ticketRepository = new TicketRepository()) {}

    public async execute(id: string) {
        return await this.ticketRepository.findById(id)
    }
}
