import { TicketPriorityEnum } from "../../../domain/enums/ticketPriority.enum.js";
import { TicketStatusEnum } from "../../../domain/enums/ticketStatus.enum.js";
import { DashboardRepository, type DashboardRepositoryFilters } from "../../repositories/dashboard.repository.js";
import { buildDailySeries, getPreviousRange, getRange, percentageChange, toDateKey } from "./dashboardRange.js";

export type DashboardFilters = {
    endDate?: Date;
    priority?: TicketPriorityEnum;
    requesterId?: string;
    responsibleId?: string | null;
    search?: string;
    startDate?: Date;
    status?: TicketStatusEnum;
};

const statuses = Object.values(TicketStatusEnum);
const priorities = Object.values(TicketPriorityEnum);

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
                name: group.responsibleId ? responsibleNameById.get(group.responsibleId) || "Responsável removido" : "Sem responsável",
            })),
            ticketsByStatus: statuses.map((status) => ({
                count: statusCounts[status],
                status,
            })),
        };
    }
}
