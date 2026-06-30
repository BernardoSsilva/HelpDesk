import { Router } from "express";
import { TicketPriorityEnum } from "../../domain/enums/ticketPriority.enum.js";
import { TicketStatusEnum } from "../../domain/enums/ticketStatus.enum.js";
import { GetDashboardUseCase, type DashboardFilters } from "../../infrastructure/usecases/dashboard/index.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const dashboardRoutes = Router();

dashboardRoutes.use(authMiddleware);

function firstQueryValue(value: unknown) {
    if (Array.isArray(value)) {
        return typeof value[0] === "string" ? value[0] : undefined;
    }

    return typeof value === "string" ? value : undefined;
}

function parseDate(value: string | undefined, fieldName: string) {
    if (!value) {
        return undefined;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime())) {
        throw new Error(`${fieldName} is invalid`);
    }

    return date;
}

function parseEnum<T extends Record<string, string>>(value: string | undefined, enumObject: T, fieldName: string) {
    if (!value) {
        return undefined;
    }

    if (!Object.values(enumObject).includes(value)) {
        throw new Error(`${fieldName} is invalid`);
    }

    return value as T[keyof T];
}

dashboardRoutes.get("/", async (req, res) => {
    try {
        const responsibleId = firstQueryValue(req.query.responsibleId);
        const filters: DashboardFilters = {};
        const endDate = parseDate(firstQueryValue(req.query.endDate), "End date");
        const priority = parseEnum(firstQueryValue(req.query.priority), TicketPriorityEnum, "Priority");
        const requesterId = firstQueryValue(req.query.requesterId);
        const search = firstQueryValue(req.query.search)?.trim();
        const startDate = parseDate(firstQueryValue(req.query.startDate), "Start date");
        const status = parseEnum(firstQueryValue(req.query.status), TicketStatusEnum, "Status");

        if (endDate) filters.endDate = endDate;
        if (priority) filters.priority = priority;
        if (requesterId) filters.requesterId = requesterId;
        if (responsibleId === "unassigned") filters.responsibleId = null;
        if (responsibleId && responsibleId !== "unassigned") filters.responsibleId = responsibleId;
        if (search) filters.search = search;
        if (startDate) filters.startDate = startDate;
        if (status) filters.status = status;

        const getDashboardUseCase = new GetDashboardUseCase();
        const dashboard = await getDashboardUseCase.execute(filters);

        res.status(200).json(dashboard);
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Error loading dashboard" });
    }
});

export { dashboardRoutes };
