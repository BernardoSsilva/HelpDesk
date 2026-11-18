import type { TicketEntity } from "../../domain/entities/ticket.entity.js";
import type { TicketHistoryEntity } from "../../domain/entities/ticketHistory.entity.js";
import { prisma } from "../prisma.client.js";

const newestFirst = { updatedAt: "desc" } as const

function historyData(entity: TicketHistoryEntity) {
    return {
        id: entity.getId(),
        ticketId: entity.getTicketId(),
        action: entity.getAction(),
        changedByUserId: entity.getChangedByUserId(),
        previousValue: entity.getPreviousValue(),
        newValue: entity.getNewValue(),
        comment: entity.getComment(),
        createdAt: entity.createdAt,
    }
}

export class TicketRepository {
    /** Cria o ticket e o primeiro registro de histórico de forma atômica. */
    public async createWithHistory(entity: TicketEntity, history: TicketHistoryEntity) {
        return await prisma.$transaction(async (tx) => {
            const ticket = await tx.ticket.create({
                data: {
                    id: entity.getId(),
                    title: entity.getTitle(),
                    description: entity.getDescription(),
                    requesterId: entity.getRequesterId(),
                    responsibleId: entity.getResponsibleId(),
                    priority: entity.getPriority(),
                    status: entity.getStatus(),
                    department: entity.getDepartment(),
                    createdAt: entity.createdAt,
                },
            })

            await tx.ticketHistory.create({ data: historyData(history) })

            return ticket
        })
    }

    public async findById(id: string) {
        return await prisma.ticket.findUnique({
            where: {
                id,
            },
        })
    }

    public async findByRequesterId(requesterId: string) {
        return await prisma.ticket.findMany({
            where: {
                requesterId,
            },
            orderBy: newestFirst,
        })
    }

    public async findByResponsibleId(responsibleId: string) {
        return await prisma.ticket.findMany({
            where: {
                responsibleId,
            },
            orderBy: newestFirst,
        })
    }

    public async listTickets() {
        return await prisma.ticket.findMany({
            orderBy: newestFirst,
        })
    }

    /** Atualiza o ticket e grava o histórico das mudanças na mesma transação. */
    public async updateWithHistory(entity: TicketEntity, histories: TicketHistoryEntity[]) {
        return await prisma.$transaction(async (tx) => {
            const ticket = await tx.ticket.update({
                where: {
                    id: entity.getId(),
                },
                data: {
                    title: entity.getTitle(),
                    description: entity.getDescription(),
                    requesterId: entity.getRequesterId(),
                    responsibleId: entity.getResponsibleId(),
                    priority: entity.getPriority(),
                    status: entity.getStatus(),
                    department: entity.getDepartment(),
                    updatedAt: new Date(),
                },
            })

            if (histories.length) {
                await tx.ticketHistory.createMany({ data: histories.map(historyData) })
            }

            return ticket
        })
    }

    /** Registra um comentário e marca o ticket como atualizado (sobe nos "recentes"). */
    public async addCommentWithTouch(history: TicketHistoryEntity) {
        return await prisma.$transaction(async (tx) => {
            const created = await tx.ticketHistory.create({ data: historyData(history) })

            await tx.ticket.update({
                where: {
                    id: history.getTicketId(),
                },
                data: {
                    updatedAt: new Date(),
                },
            })

            return created
        })
    }

    public async deleteTicket(id: string) {
        return await prisma.ticket.delete({
            where: {
                id,
            },
        })
    }
}
