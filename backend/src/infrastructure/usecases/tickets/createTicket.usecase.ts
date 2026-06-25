import { TicketEntity } from "../../../domain/entities/ticket.entity.js";
import { TicketHistoryEntity } from "../../../domain/entities/ticketHistory.entity.js";
import { TicketHistoryActionEnum } from "../../../domain/enums/ticketHistoryAction.enum.js";
import type { TicketPriorityEnum } from "../../../domain/enums/ticketPriority.enum.js";
import { TicketStatusEnum } from "../../../domain/enums/ticketStatus.enum.js";
import { TicketHistoryRepository } from "../../repositories/ticketHistory.repository.js";
import { TicketRepository } from "../../repositories/tickets.repository.js";

type Input = {
    title: string;
    description: string;
    requesterId: string;
    priority: TicketPriorityEnum;
    responsibleId?: string | null;
    changedByUserId?: string;
}

export class CreateTicketUseCase {
    constructor(
        private readonly ticketRepository = new TicketRepository(),
        private readonly ticketHistoryRepository = new TicketHistoryRepository(),
    ) {}

    public async execute(input: Input) {
        const ticket = new TicketEntity({
            title: input.title,
            description: input.description,
            requesterId: input.requesterId,
            responsibleId: input.responsibleId ?? null,
            priority: input.priority,
            status: TicketStatusEnum.ABERTO,
        })

        const createdTicket = await this.ticketRepository.createTicket(ticket)

        const history = new TicketHistoryEntity({
            ticketId: createdTicket.id,
            action: TicketHistoryActionEnum.TICKET_CRIADO,
            changedByUserId: input.changedByUserId ?? input.requesterId,
            newValue: TicketStatusEnum.ABERTO,
            comment: "Ticket criado",
        })

        await this.ticketHistoryRepository.createTicketHistory(history)

        return createdTicket
    }
}
