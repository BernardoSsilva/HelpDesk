import { TicketEntity } from "../../../domain/entities/ticket.entity.js";
import { TicketHistoryEntity } from "../../../domain/entities/ticketHistory.entity.js";
import type { TicketDepartmentEnum } from "../../../domain/enums/ticketDepartment.enum.js";
import { TicketHistoryActionEnum } from "../../../domain/enums/ticketHistoryAction.enum.js";
import type { TicketPriorityEnum } from "../../../domain/enums/ticketPriority.enum.js";
import type { TicketStatusEnum } from "../../../domain/enums/ticketStatus.enum.js";
import { ForbiddenError, NotFoundError, ValidationError } from "../../../domain/errors/domain.error.js";
import { canEditTicket, type Actor } from "../../../domain/policies/ticket.policy.js";
import { TicketRepository } from "../../repositories/tickets.repository.js";
import { UserRepository } from "../../repositories/users.repository.js";

type Input = {
    id: string;
    actor: Actor;
    title?: string | undefined;
    description?: string | undefined;
    priority?: TicketPriorityEnum | undefined;
    status?: TicketStatusEnum | undefined;
    department?: TicketDepartmentEnum | null | undefined;
    responsibleId?: string | null | undefined;
    comment?: string | undefined;
}

type CurrentTicket = {
    title: string;
    description: string;
    priority: string;
    status: string;
    department: string | null;
    responsibleId: string | null;
}

export class UpdateTicketUseCase {
    constructor(
        private readonly ticketRepository = new TicketRepository(),
        private readonly userRepository = new UserRepository(),
    ) {}

    public async execute(input: Input) {
        const ticket = await this.ticketRepository.findById(input.id)

        if (!ticket) {
            throw new NotFoundError("Ticket não encontrado")
        }

        if (!canEditTicket(input.actor, ticket)) {
            throw new ForbiddenError("Você não tem permissão para alterar este ticket")
        }

        if (input.responsibleId && input.responsibleId !== ticket.responsibleId) {
            const responsible = await this.userRepository.findById(input.responsibleId)

            if (!responsible) {
                throw new ValidationError("Responsável não encontrado", [
                    { field: "responsibleId", message: "Responsável não encontrado" },
                ])
            }
        }

        const entity = new TicketEntity({
            id: ticket.id,
            title: input.title ?? ticket.title,
            description: input.description ?? ticket.description,
            requesterId: ticket.requesterId,
            responsibleId: input.responsibleId !== undefined ? input.responsibleId : ticket.responsibleId,
            department: input.department !== undefined ? input.department : (ticket.department as TicketDepartmentEnum | null),
            priority: input.priority ?? ticket.priority as TicketPriorityEnum,
            status: input.status ?? ticket.status as TicketStatusEnum,
        })

        return await this.ticketRepository.updateWithHistory(entity, this.buildHistoryItems(input, ticket))
    }

    private buildHistoryItems(input: Input, currentTicket: CurrentTicket) {
        const historyItems: TicketHistoryEntity[] = []
        const changedByUserId = input.actor.id

        const record = (action: TicketHistoryActionEnum, previousValue: string | null, newValue: string | null) => {
            historyItems.push(new TicketHistoryEntity({
                ticketId: input.id,
                action,
                changedByUserId,
                previousValue,
                newValue,
            }))
        }

        if (input.title && input.title !== currentTicket.title) {
            record(TicketHistoryActionEnum.TITULO_ALTERADO, currentTicket.title, input.title)
        }

        if (input.description && input.description !== currentTicket.description) {
            record(TicketHistoryActionEnum.DESCRICAO_ALTERADA, currentTicket.description, input.description)
        }

        if (input.priority && input.priority !== currentTicket.priority) {
            record(TicketHistoryActionEnum.PRIORIDADE_ALTERADA, currentTicket.priority, input.priority)
        }

        if (input.status && input.status !== currentTicket.status) {
            record(TicketHistoryActionEnum.STATUS_ALTERADO, currentTicket.status, input.status)
        }

        if (input.department !== undefined && input.department !== currentTicket.department) {
            record(TicketHistoryActionEnum.DEPARTAMENTO_ALTERADO, currentTicket.department, input.department)
        }

        if (input.responsibleId !== undefined && input.responsibleId !== currentTicket.responsibleId) {
            record(TicketHistoryActionEnum.RESPONSAVEL_ALTERADO, currentTicket.responsibleId, input.responsibleId)
        }

        if (input.comment) {
            historyItems.push(new TicketHistoryEntity({
                ticketId: input.id,
                action: TicketHistoryActionEnum.COMENTARIO_ADICIONADO,
                changedByUserId,
                comment: input.comment,
            }))
        }

        return historyItems
    }
}
