import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler, notFoundHandler } from "./http/errors/error.middleware.js";
import { createLoginRateLimiter, type LoginRateLimitOptions } from "./http/middlewares/rate-limit.middleware.js";
import { dashboardRoutes } from "./http/routes/dashboard.routes.js";
import { createHealthRoutes } from "./http/routes/health.routes.js";
import { swaggerRoutes } from "./http/routes/swagger.routes.js";
import { ticketsRoutes } from "./http/routes/tickets.routes.js";
import { createUsersRoutes } from "./http/routes/users.routes.js";
import { prisma } from "./infrastructure/prisma.client.js";

export type AppOptions = {
    /** Origens permitidas no CORS; `*` (padrão) libera qualquer origem. */
    corsOrigins?: string[] | "*";
    /** Número de proxies confiáveis à frente da API (ex.: 1 atrás do nginx). */
    trustProxy?: number | false;
    loginRateLimit?: LoginRateLimitOptions;
    /** Verificação de saúde do banco; por padrão executa `SELECT 1`. */
    checkDatabase?: () => Promise<unknown>;
};

/** Monta o app Express sem abrir porta, o que facilita testes. */
export function createApp(options: AppOptions = {}) {
    const app = express();

    app.set("trust proxy", options.trustProxy ?? false);

    app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
    app.use(
        cors({
            origin: options.corsOrigins ?? "*",
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
        }),
    );
    app.use(express.json({ limit: "100kb" }));

    app.get("/", (_req, res) => {
        res.json({ name: "Help Desk API", docs: "/api/docs" });
    });

    app.use(createHealthRoutes(options.checkDatabase ?? (() => prisma.$queryRaw`SELECT 1`)));
    app.use("/api", swaggerRoutes);
    app.use("/dashboard", dashboardRoutes);
    app.use("/users", createUsersRoutes(createLoginRateLimiter(options.loginRateLimit)));
    app.use("/tickets", ticketsRoutes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}
