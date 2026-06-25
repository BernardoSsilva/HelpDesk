import type { TicketHistoryEntity } from "../../domain/entities/ticketHistory.entity.js";
import { prisma } from "../prisma.client.js";

export class TicketHistoryRepository {
    public async createTicketHistory(entity: TicketHistoryEntity) {
        return await prisma.ticketHistory.create({
            data: {
                id: entity.getId(),
                ticketId: entity.getTicketId(),
                action: entity.getAction(),
                changedByUserId: entity.getChangedByUserId(),
                previousValue: entity.getPreviousValue(),
                newValue: entity.getNewValue(),
                comment: entity.getComment(),
                createdAt: entity.createdAt,
            },
        })
    }

    public async findById(id: string) {
        return await prisma.ticketHistory.findUnique({
            where: {
                id,
            },
        })
    }

    public async findByTicketId(ticketId: string) {
        return await prisma.ticketHistory.findMany({
            where: {
                ticketId,
            },
            orderBy: {
                createdAt: "asc",
            },
        })
    }

    public async updateTicketHistory(entity: TicketHistoryEntity) {
        return await prisma.ticketHistory.update({
            where: {
                id: entity.getId(),
            },
            data: {
                ticketId: entity.getTicketId(),
                action: entity.getAction(),
                changedByUserId: entity.getChangedByUserId(),
                previousValue: entity.getPreviousValue(),
                newValue: entity.getNewValue(),
                comment: entity.getComment(),
                updatedAt: new Date(),
            },
        })
    }

    public async deleteTicketHistory(id: string) {
        return await prisma.ticketHistory.delete({
            where: {
                id,
            },
        })
    }
}
