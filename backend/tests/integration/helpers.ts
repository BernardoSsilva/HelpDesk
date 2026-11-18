import { execSync } from "node:child_process";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const testDatabaseUrl = process.env["TEST_DATABASE_URL"];

export const skipReason = testDatabaseUrl
    ? false
    : "defina TEST_DATABASE_URL (banco descartável, com 'test' no nome) para rodar os testes de integração";

/**
 * Os testes apagam todas as tabelas. Esta guarda impede que alguém aponte
 * `TEST_DATABASE_URL` para um banco de desenvolvimento ou produção por engano.
 */
export function assertDisposableDatabase(url: string) {
    const databaseName = new URL(url).pathname.replace("/", "");

    if (!/test/i.test(databaseName)) {
        throw new Error(`Recusando rodar testes de integração no banco "${databaseName}": o nome precisa conter "test".`);
    }
}

export const jwtSecret = "segredo-de-teste-de-integracao-com-mais-de-32-caracteres";

/** Aplica as migrations no banco de testes e prepara as variáveis de ambiente do app. */
export function prepareEnvironment(url: string) {
    assertDisposableDatabase(url);

    process.env["DATABASE_URL"] = url;
    process.env["JWT_SECRET"] = jwtSecret;

    execSync("npx prisma migrate deploy", {
        cwd: backendRoot,
        env: { ...process.env, DATABASE_URL: url },
        stdio: "pipe",
    });
}

export type TestResponse<T = unknown> = {
    status: number;
    body: T;
};

export type TestClient = {
    baseUrl: string;
    request: <T = any>(method: string, path: string, options?: { token?: string | undefined; body?: unknown; rawBody?: string }) => Promise<TestResponse<T>>;
    close: () => Promise<void>;
};

export async function listen(app: { listen: (port: number, callback: () => void) => Server }): Promise<TestClient> {
    const server = await new Promise<Server>((resolve) => {
        const instance = app.listen(0, () => resolve(instance));
    });
    const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

    return {
        baseUrl,
        async request(method, requestPath, { token, body, rawBody } = {}) {
            const response = await fetch(`${baseUrl}${requestPath}`, {
                method,
                headers: {
                    ...(body !== undefined || rawBody !== undefined ? { "Content-Type": "application/json" } : {}),
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: rawBody ?? (body !== undefined ? JSON.stringify(body) : null),
            });
            const text = await response.text();

            return { status: response.status, body: text ? JSON.parse(text) : null };
        },
        close: () => new Promise((resolve) => server.close(() => resolve())),
    };
}
