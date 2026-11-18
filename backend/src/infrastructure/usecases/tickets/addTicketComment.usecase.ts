import { TicketHistoryEntity } from "../../../domain/entities/ticketHistory.entity.js";
import { TicketHistoryActionEnum } from "../../../domain/enums/ticketHistoryAction.enum.js";
import { NotFoundError } from "../../../domain/errors/domain.error.js";
import { TicketRepository } from "../../repositories/tickets.repository.js";

type Input = {
    ticketId: string;
    changedByUserId: string;
    comment: string;
}

export class AddTicketCommentUseCase {
    constructor(private readonly ticketRepository = new TicketRepository()) {}

    public async execute(input: Input) {
        const ticket = await this.ticketRepository.findById(input.ticketId)

        if (!ticket) {
            throw new NotFoundError("Ticket não encontrado")
        }

        const history = new TicketHistoryEntity({
            ticketId: input.ticketId,
            action: TicketHistoryActionEnum.COMENTARIO_ADICIONADO,
            changedByUserId: input.changedByUserId,
            comment: input.comment,
        })

        return await this.ticketRepository.addCommentWithTouch(history)
    }
}
