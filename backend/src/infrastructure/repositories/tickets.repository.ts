import type { TicketEntity } from "../../domain/entities/ticket.entity.js";
import { prisma } from "../prisma.client.js";

export class TicketRepository {
    public async createTicket(entity: TicketEntity) {
        return await prisma.ticket.create({
            data: {
                id: entity.getId(),
                title: entity.getTitle(),
                description: entity.getDescription(),
                requesterId: entity.getRequesterId(),
                responsibleId: entity.getResponsibleId(),
                priority: entity.getPriority(),
                status: entity.getStatus(),
                createdAt: entity.createdAt,
            },
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
        })
    }

    public async findByResponsibleId(responsibleId: string) {
        return await prisma.ticket.findMany({
            where: {
                responsibleId,
            },
        })
    }

    public async listTickets() {
        return await prisma.ticket.findMany()
    }

    public async updateTicket(entity: TicketEntity) {
        return await prisma.ticket.update({
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
                updatedAt: new Date(),
            },
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
