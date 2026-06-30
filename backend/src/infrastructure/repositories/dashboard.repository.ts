import type { Prisma, TicketPriorityEnum, TicketStatusEnum } from "../../../generated/prisma/client.js";
import { prisma } from "../prisma.client.js";

export type DashboardRepositoryFilters = {
    endDate?: Date;
    priority?: TicketPriorityEnum;
    requesterId?: string;
    responsibleId?: string | null;
    search?: string;
    startDate?: Date;
    status?: TicketStatusEnum;
};

function buildTicketWhere(filters: DashboardRepositoryFilters): Prisma.TicketWhereInput {
    const where: Prisma.TicketWhereInput = {};

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.priority) {
        where.priority = filters.priority;
    }

    if (filters.requesterId) {
        where.requesterId = filters.requesterId;
    }

    if (filters.responsibleId !== undefined) {
        where.responsibleId = filters.responsibleId;
    }

    if (filters.startDate || filters.endDate) {
        const createdAt: Prisma.DateTimeFilter<"Ticket"> = {};

        if (filters.startDate) {
            createdAt.gte = filters.startDate;
        }

        if (filters.endDate) {
            createdAt.lte = filters.endDate;
        }

        where.createdAt = createdAt;
    }

    if (filters.search) {
        where.OR = [
            { title: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
        ];
    }

    return where;
}

export class DashboardRepository {
    public async getTicketSummary(filters: DashboardRepositoryFilters, previousFilters: DashboardRepositoryFilters) {
        const where = buildTicketWhere(filters);
        const previousWhere = buildTicketWhere(previousFilters);

        const [
            total,
            previousTotal,
            statusGroups,
            priorityGroups,
            responsibleGroups,
            requesterUsers,
            responsibleUsers,
            createdTickets,
            recentTickets,
        ] = await Promise.all([
            prisma.ticket.count({ where }),
            prisma.ticket.count({ where: previousWhere }),
            prisma.ticket.groupBy({
                by: ["status"],
                where,
                _count: { _all: true },
            }),
            prisma.ticket.groupBy({
                by: ["priority"],
                where,
                _count: { _all: true },
            }),
            prisma.ticket.groupBy({
                by: ["responsibleId"],
                where,
                _count: { _all: true },
            }),
            prisma.user.findMany({
                orderBy: { name: "asc" },
                select: { id: true, name: true },
                where: {
                    requestedTickets: {
                        some: {},
                    },
                },
            }),
            prisma.user.findMany({
                orderBy: { name: "asc" },
                select: { id: true, name: true },
                where: {
                    assignedTickets: {
                        some: {},
                    },
                },
            }),
            prisma.ticket.findMany({
                orderBy: { createdAt: "asc" },
                select: { createdAt: true },
                where,
            }),
            prisma.ticket.findMany({
                orderBy: { updatedAt: "desc" },
                take: 8,
                where,
                select: {
                    id: true,
                    title: true,
                    status: true,
                    priority: true,
                    requesterId: true,
                    responsibleId: true,
                    createdAt: true,
                    updatedAt: true,
                    requester: {
                        select: { id: true, name: true },
                    },
                    responsible: {
                        select: { id: true, name: true },
                    },
                },
            }),
        ]);

        const responsibleIds = responsibleGroups
            .map((group) => group.responsibleId)
            .filter((id): id is string => Boolean(id));

        const responsibleNames = responsibleIds.length
            ? await prisma.user.findMany({
                  select: { id: true, name: true },
                  where: { id: { in: responsibleIds } },
              })
            : [];

        return {
            createdTickets,
            previousTotal,
            priorityGroups,
            recentTickets,
            requesterUsers,
            responsibleGroups,
            responsibleNames,
            responsibleUsers,
            statusGroups,
            total,
        };
    }
}
