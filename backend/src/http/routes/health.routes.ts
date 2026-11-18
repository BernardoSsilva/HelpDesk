import { Router } from "express";

/**
 * `GET /health` para healthchecks (Docker, balanceadores): responde 200 quando
 * a API e o banco estão acessíveis e 503 caso contrário.
 */
export function createHealthRoutes(checkDatabase: () => Promise<unknown>) {
    const healthRoutes = Router();

    healthRoutes.get("/health", async (_req, res) => {
        try {
            await checkDatabase();
            res.status(200).json({ status: "ok" });
        } catch (error) {
            console.error("Healthcheck falhou:", error);
            res.status(503).json({ status: "unavailable" });
        }
    });

    return healthRoutes;
}
