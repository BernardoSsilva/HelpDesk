import { TicketPriorityEnum } from "../../../domain/enums/ticketPriority.enum.js";
import { TicketStatusEnum } from "../../../domain/enums/ticketStatus.enum.js";
import { DashboardRepository, type DashboardRepositoryFilters } from "../../repositories/dashboard.repository.js";

export type DashboardFilters = {
    endDate?: Date;
    priority?: TicketPriorityEnum;
    requesterId?: string;
    responsibleId?: string | null;
    search?: string;
    startDate?: Date;
    status?: TicketStatusEnum;
};

const dayMs = 24 * 60 * 60 * 1000;

const statuses = Object.values(TicketStatusEnum);
const priorities = Object.values(TicketPriorityEnum);

function toDateKey(date: Date) {
    return date.toISOString().slice(0, 10);
}

function toDayLabel(dateKey: string) {
    const [year, month, day] = dateKey.split("-");
    return `${day}/${month}`;
}

function getRange(filters: DashboardFilters) {
    const end = filters.endDate ? new Date(filters.endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const start = filters.startDate ? new Date(filters.startDate) : new Date(end.getTime() - 6 * dayMs);
    start.setHours(0, 0, 0, 0);

    return { end, start };
}

function getPreviousRange(start: Date, end: Date) {
    const rangeDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / dayMs) + 1);
    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - (rangeDays - 1) * dayMs);
    previousStart.setHours(0, 0, 0, 0);
    previousEnd.setHours(23, 59, 59, 999);

    return { previousEnd, previousStart };
}

function percentageChange(current: number, previous: number) {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }

    return Math.round(((current - previous) / previous) * 100);
}

function buildDailySeries(createdTickets: { createdAt: Date }[], start: Date, end: Date) {
    const totalsByDate = new Map<string, number>();
    const cursor = new Date(start);

    while (cursor <= end) {
        totalsByDate.set(toDateKey(cursor), 0);
        cursor.setDate(cursor.getDate() + 1);
    }

    createdTickets.forEach((ticket) => {
        const key = toDateKey(ticket.createdAt);
        totalsByDate.set(key, (totalsByDate.get(key) || 0) + 1);
    });

    return Array.from(totalsByDate.entries()).map(([date, count]) => ({
        count,
        date,
        label: toDayLabel(date),
    }));
}

export class GetDashboardUseCase {
    constructor(private readonly dashboardRepository = new DashboardRepository()) {}

    public async execute(filters: DashboardFilters) {
        const { end, start } = getRange(filters);
        const { previousEnd, previousStart } = getPreviousRange(start, end);

        const currentFilters: DashboardRepositoryFilters = {
            ...filters,
            endDate: end,
            startDate: start,
        };
        const previousFilters: DashboardRepositoryFilters = {
            ...filters,
            endDate: previousEnd,
            startDate: previousStart,
        };

        const summary = await this.dashboardRepository.getTicketSummary(currentFilters, previousFilters);
        const statusCounts = Object.fromEntries(statuses.map((status) => [status, 0])) as Record<TicketStatusEnum, number>;
        const priorityCounts = Object.fromEntries(priorities.map((priority) => [priority, 0])) as Record<TicketPriorityEnum, number>;
        const responsibleNameById = new Map(summary.responsibleNames.map((user) => [user.id, user.name]));

        summary.statusGroups.forEach((group) => {
            statusCounts[group.status] = group._count._all;
        });

        summary.priorityGroups.forEach((group) => {
            priorityCounts[group.priority] = group._count._all;
        });

        return {
            filters: {
                endDate: toDateKey(end),
                startDate: toDateKey(start),
            },
            options: {
                requesters: summary.requesterUsers,
                responsibles: summary.responsibleUsers,
            },
            recentTickets: summary.recentTickets,
            series: buildDailySeries(summary.createdTickets, start, end),
            stats: {
                changePercent: percentageChange(summary.total, summary.previousTotal),
                previousTotal: summary.previousTotal,
                total: summary.total,
            },
            ticketsByPriority: priorities.map((priority) => ({
                count: priorityCounts[priority],
                priority,
            })),
            ticketsByResponsible: summary.responsibleGroups.map((group) => ({
                count: group._count._all,
                id: group.responsibleId,
                name: group.responsibleId ? responsibleNameById.get(group.responsibleId) || "Responsavel removido" : "Sem responsavel",
            })),
            ticketsByStatus: statuses.map((status) => ({
                count: statusCounts[status],
                status,
            })),
        };
    }
}
