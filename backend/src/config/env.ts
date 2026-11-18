import "dotenv/config";

const KNOWN_WEAK_SECRETS = new Set([
    "ticket_management_secret",
    "troque-por-um-segredo-longo-e-aleatorio",
    "secret",
    "changeme",
]);

export type AppConfig = {
    nodeEnv: string;
    isProduction: boolean;
    port: number;
    databaseUrl: string;
    jwtSecret: string;
    /** Origens permitidas no CORS; `*` libera qualquer origem. */
    corsOrigins: string[] | "*";
    /** Valor repassado ao `trust proxy` do Express (ex.: 1 atrás do nginx). */
    trustProxy: number | false;
    /** Tentativas de login malsucedidas permitidas por IP em cada janela. */
    loginRateLimit: { limit: number; windowMs: number };
    warnings: string[];
};

function required(name: string, env: NodeJS.ProcessEnv) {
    const value = env[name]?.trim();

    if (!value) {
        throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
    }

    return value;
}

function parseCorsOrigins(value: string | undefined): string[] | "*" {
    const origins = (value ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    return origins.length && !origins.includes("*") ? origins : "*";
}

function positiveInt(value: string | undefined, fallback: number) {
    const parsed = Number(value);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseTrustProxy(value: string | undefined): number | false {
    const hops = Number(value);

    return Number.isInteger(hops) && hops > 0 ? hops : false;
}

/**
 * Lê e valida as variáveis de ambiente. Falha rápido quando algo essencial
 * falta e devolve avisos (não bloqueantes) para configurações inseguras.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
    const nodeEnv = env["NODE_ENV"] ?? "development";
    const isProduction = nodeEnv === "production";
    const jwtSecret = required("JWT_SECRET", env);
    const warnings: string[] = [];

    if (KNOWN_WEAK_SECRETS.has(jwtSecret.toLowerCase()) || jwtSecret.length < 32) {
        warnings.push(
            "JWT_SECRET é curto ou de exemplo. Gere um segredo forte (ex.: `openssl rand -hex 32`).",
        );
    }

    return {
        nodeEnv,
        isProduction,
        port: Number(env["PORT"]) || 3000,
        databaseUrl: required("DATABASE_URL", env),
        jwtSecret,
        corsOrigins: parseCorsOrigins(env["FRONTEND_URL"]),
        trustProxy: parseTrustProxy(env["TRUST_PROXY"]),
        loginRateLimit: {
            limit: positiveInt(env["LOGIN_RATE_LIMIT_MAX"], 10),
            windowMs: positiveInt(env["LOGIN_RATE_LIMIT_WINDOW_MINUTES"], 15) * 60 * 1000,
        },
        warnings,
    };
}
