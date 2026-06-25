import { TicketHistoryEntity } from "../../../domain/entities/ticketHistory.entity.js";
import { TicketHistoryActionEnum } from "../../../domain/enums/ticketHistoryAction.enum.js";
import { TicketHistoryRepository } from "../../repositories/ticketHistory.repository.js";
import { TicketRepository } from "../../repositories/tickets.repository.js";

type Input = {
    ticketId: string;
    changedByUserId: string;
    comment: string;
}

export class AddTicketCommentUseCase {
    constructor(
        private readonly ticketRepository = new TicketRepository(),
        private readonly ticketHistoryRepository = new TicketHistoryRepository(),
    ) {}

    public async execute(input: Input) {
        const ticket = await this.ticketRepository.findById(input.ticketId)

        if (!ticket) {
            throw new Error("Ticket not found")
        }

        const history = new TicketHistoryEntity({
            ticketId: input.ticketId,
            action: TicketHistoryActionEnum.COMENTARIO_ADICIONADO,
            changedByUserId: input.changedByUserId,
            comment: input.comment,
        })

        return await this.ticketHistoryRepository.createTicketHistory(history)
    }
}
