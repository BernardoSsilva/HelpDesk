import { TicketEntity } from "../../../domain/entities/ticket.entity.js";
import { TicketHistoryEntity } from "../../../domain/entities/ticketHistory.entity.js";
import { TicketHistoryActionEnum } from "../../../domain/enums/ticketHistoryAction.enum.js";
import type { TicketPriorityEnum } from "../../../domain/enums/ticketPriority.enum.js";
import type { TicketStatusEnum } from "../../../domain/enums/ticketStatus.enum.js";
import { TicketHistoryRepository } from "../../repositories/ticketHistory.repository.js";
import { TicketRepository } from "../../repositories/tickets.repository.js";

type Input = {
    id: string;
    changedByUserId: string;
    title?: string;
    description?: string;
    priority?: TicketPriorityEnum;
    status?: TicketStatusEnum;
    responsibleId?: string | null;
    comment?: string;
}

export class UpdateTicketUseCase {
    constructor(
        private readonly ticketRepository = new TicketRepository(),
        private readonly ticketHistoryRepository = new TicketHistoryRepository(),
    ) {}

    public async execute(input: Input) {
        const ticket = await this.ticketRepository.findById(input.id)

        if (!ticket) {
            throw new Error("Ticket not found")
        }

        const entity = new TicketEntity({
            id: ticket.id,
            title: input.title ?? ticket.title,
            description: input.description ?? ticket.description,
            requesterId: ticket.requesterId,
            responsibleId: input.responsibleId !== undefined ? input.responsibleId : ticket.responsibleId,
            priority: input.priority ?? ticket.priority as TicketPriorityEnum,
            status: input.status ?? ticket.status as TicketStatusEnum,
        })

        const updatedTicket = await this.ticketRepository.updateTicket(entity)
        const historyItems = this.buildHistoryItems(input, ticket)

        for (const history of historyItems) {
            await this.ticketHistoryRepository.createTicketHistory(history)
        }

        return updatedTicket
    }

    private buildHistoryItems(input: Input, currentTicket: {
        title: string;
        description: string;
        priority: string;
        status: string;
        responsibleId: string | null;
    }) {
        const historyItems: TicketHistoryEntity[] = []

        if (input.title && input.title !== currentTicket.title) {
            historyItems.push(new TicketHistoryEntity({
                ticketId: input.id,
                action: TicketHistoryActionEnum.TITULO_ALTERADO,
                changedByUserId: input.changedByUserId,
                previousValue: currentTicket.title,
                newValue: input.title,
            }))
        }

        if (input.description && input.description !== currentTicket.description) {
            historyItems.push(new TicketHistoryEntity({
                ticketId: input.id,
                action: TicketHistoryActionEnum.DESCRICAO_ALTERADA,
                changedByUserId: input.changedByUserId,
                previousValue: currentTicket.description,
                newValue: input.description,
            }))
        }

        if (input.priority && input.priority !== currentTicket.priority) {
            historyItems.push(new TicketHistoryEntity({
                ticketId: input.id,
                action: TicketHistoryActionEnum.PRIORIDADE_ALTERADA,
                changedByUserId: input.changedByUserId,
                previousValue: currentTicket.priority,
                newValue: input.priority,
            }))
        }

        if (input.status && input.status !== currentTicket.status) {
            historyItems.push(new TicketHistoryEntity({
                ticketId: input.id,
                action: TicketHistoryActionEnum.STATUS_ALTERADO,
                changedByUserId: input.changedByUserId,
                previousValue: currentTicket.status,
                newValue: input.status,
            }))
        }

        if (input.responsibleId !== undefined && input.responsibleId !== currentTicket.responsibleId) {
            historyItems.push(new TicketHistoryEntity({
                ticketId: input.id,
                action: TicketHistoryActionEnum.RESPONSAVEL_ALTERADO,
                changedByUserId: input.changedByUserId,
                previousValue: currentTicket.responsibleId,
                newValue: input.responsibleId,
            }))
        }

        if (input.comment) {
            historyItems.push(new TicketHistoryEntity({
                ticketId: input.id,
                action: TicketHistoryActionEnum.COMENTARIO_ADICIONADO,
                changedByUserId: input.changedByUserId,
                comment: input.comment,
            }))
        }

        return historyItems
    }
}
