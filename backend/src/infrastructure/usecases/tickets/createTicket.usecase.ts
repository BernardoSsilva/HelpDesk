import { TicketEntity } from "../../../domain/entities/ticket.entity.js";
import { TicketHistoryEntity } from "../../../domain/entities/ticketHistory.entity.js";
import type { TicketDepartmentEnum } from "../../../domain/enums/ticketDepartment.enum.js";
import { TicketHistoryActionEnum } from "../../../domain/enums/ticketHistoryAction.enum.js";
import type { TicketPriorityEnum } from "../../../domain/enums/ticketPriority.enum.js";
import { TicketStatusEnum } from "../../../domain/enums/ticketStatus.enum.js";
import { ForbiddenError, ValidationError } from "../../../domain/errors/domain.error.js";
import { canCreateTicketFor, type Actor } from "../../../domain/policies/ticket.policy.js";
import { TicketRepository } from "../../repositories/tickets.repository.js";
import { UserRepository } from "../../repositories/users.repository.js";

type Input = {
    actor: Actor;
    title: string;
    description: string;
    priority: TicketPriorityEnum;
    department?: TicketDepartmentEnum | null | undefined;
    /** Quando ausente, o solicitante é o próprio usuário autenticado. */
    requesterId?: string | undefined;
    responsibleId?: string | null | undefined;
}

export class CreateTicketUseCase {
    constructor(
        private readonly ticketRepository = new TicketRepository(),
        private readonly userRepository = new UserRepository(),
    ) {}

    public async execute(input: Input) {
        const requesterId = input.requesterId ?? input.actor.id

        if (!canCreateTicketFor(input.actor, requesterId)) {
            throw new ForbiddenError("Somente administradores podem abrir tickets em nome de outros usuários")
        }

        if (requesterId !== input.actor.id) {
            await this.assertUserExists(requesterId, "requesterId", "Solicitante não encontrado")
        }

        if (input.responsibleId) {
            await this.assertUserExists(input.responsibleId, "responsibleId", "Responsável não encontrado")
        }

        const ticket = new TicketEntity({
            title: input.title,
            description: input.description,
            requesterId,
            responsibleId: input.responsibleId ?? null,
            department: input.department ?? null,
            priority: input.priority,
            status: TicketStatusEnum.ABERTO,
        })

        const history = new TicketHistoryEntity({
            ticketId: ticket.getId(),
            action: TicketHistoryActionEnum.TICKET_CRIADO,
            changedByUserId: input.actor.id,
            newValue: TicketStatusEnum.ABERTO,
            comment: "Ticket criado",
        })

        return await this.ticketRepository.createWithHistory(ticket, history)
    }

    private async assertUserExists(id: string, field: string, message: string) {
        if (!(await this.userRepository.findById(id))) {
            throw new ValidationError(message, [{ field, message }])
        }
    }
}
