import { rateLimit } from "express-rate-limit";

export type LoginRateLimitOptions = {
    /** Tentativas falhas permitidas por IP dentro da janela. */
    limit?: number;
    windowMs?: number;
};

/**
 * Limita tentativas de login por IP para frear ataques de força bruta.
 * Logins bem-sucedidos não contam. Atrás de um proxy, configure `TRUST_PROXY`
 * para que o IP real do cliente seja usado.
 */
export function createLoginRateLimiter({ limit = 10, windowMs = 15 * 60 * 1000 }: LoginRateLimitOptions = {}) {
    return rateLimit({
        limit,
        windowMs,
        skipSuccessfulRequests: true,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        handler: (_req, res) => {
            res.status(429).json({
                code: "RATE_LIMITED",
                message: "Muitas tentativas de login. Tente novamente em alguns minutos.",
            });
        },
    });
}
