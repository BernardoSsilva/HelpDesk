import { loadConfig } from "./config/env.js";
import { createApp } from "./app.js";
import { prisma } from "./infrastructure/prisma.client.js";

const config = loadConfig();

config.warnings.forEach((warning) => console.warn(`[config] ${warning}`));

const app = createApp({
    corsOrigins: config.corsOrigins,
    trustProxy: config.trustProxy,
    loginRateLimit: config.loginRateLimit,
});

const server = app.listen(config.port, () => {
    console.log(`app listening on port ${config.port} (${config.nodeEnv})`);
});

let shuttingDown = false;

// Encerra com elegância: para de aceitar conexões, termina as em andamento e fecha o banco.
async function shutdown(signal: string) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    console.log(`${signal} recebido, encerrando...`);

    const forceExit = setTimeout(() => {
        console.error("Encerramento forçado após timeout");
        process.exit(1);
    }, 10_000);
    forceExit.unref();

    server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
    console.error("unhandledRejection:", reason);
});
