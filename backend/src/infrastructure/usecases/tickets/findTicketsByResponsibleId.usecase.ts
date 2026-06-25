import { TicketRepository } from "../../repositories/tickets.repository.js";

export class FindTicketsByResponsibleIdUseCase {
    constructor(private readonly ticketRepository = new TicketRepository()) {}

    public async execute(responsibleId: string) {
        return await this.ticketRepository.findByResponsibleId(responsibleId)
    }
}
