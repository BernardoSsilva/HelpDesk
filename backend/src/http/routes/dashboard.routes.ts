import { Router } from "express";
import { GetDashboardUseCase, type DashboardFilters } from "../../infrastructure/usecases/dashboard/index.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { dashboardQuerySchema, parse } from "../validation/schemas.js";

const dashboardRoutes = Router();

dashboardRoutes.use(authMiddleware);

dashboardRoutes.get("/", async (req, res) => {
    // Parâmetros vazios (?status=) equivalem a "sem filtro".
    const query = Object.fromEntries(Object.entries(req.query).filter(([, value]) => value !== ""));
    const { endDate, priority, requesterId, responsibleId, search, startDate, status } = parse(dashboardQuerySchema, query);

    const filters: DashboardFilters = {};

    if (endDate) filters.endDate = endDate;
    if (priority) filters.priority = priority;
    if (requesterId) filters.requesterId = requesterId;
    if (responsibleId === "unassigned") filters.responsibleId = null;
    if (responsibleId && responsibleId !== "unassigned") filters.responsibleId = responsibleId;
    if (search) filters.search = search;
    if (startDate) filters.startDate = startDate;
    if (status) filters.status = status;

    res.status(200).json(await new GetDashboardUseCase().execute(filters));
});

export { dashboardRoutes };
