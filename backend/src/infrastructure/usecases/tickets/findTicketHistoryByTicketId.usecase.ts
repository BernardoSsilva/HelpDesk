import { TicketHistoryRepository } from "../../repositories/ticketHistory.repository.js";

export class FindTicketHistoryByTicketIdUseCase {
    constructor(private readonly ticketHistoryRepository = new TicketHistoryRepository()) {}

    public async execute(ticketId: string) {
        return await this.ticketHistoryRepository.findByTicketId(ticketId)
    }
}
