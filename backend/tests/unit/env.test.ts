import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadConfig } from "../../src/config/env.js";

const strongSecret = "a".repeat(40);
const base = { DATABASE_URL: "postgresql://u:p@localhost:5432/db", JWT_SECRET: strongSecret };

describe("loadConfig", () => {
    it("falha rápido sem variáveis obrigatórias", () => {
        assert.throws(() => loadConfig({ JWT_SECRET: strongSecret }), /DATABASE_URL/);
        assert.throws(() => loadConfig({ DATABASE_URL: base.DATABASE_URL }), /JWT_SECRET/);
    });

    it("usa padrões seguros", () => {
        const config = loadConfig(base);

        assert.equal(config.port, 3000);
        assert.equal(config.corsOrigins, "*");
        assert.equal(config.trustProxy, false);
        assert.equal(config.isProduction, false);
        assert.deepEqual(config.loginRateLimit, { limit: 10, windowMs: 15 * 60 * 1000 });
        assert.deepEqual(config.warnings, []);
    });

    it("permite ajustar o limite de tentativas de login e ignora valores inválidos", () => {
        const custom = loadConfig({ ...base, LOGIN_RATE_LIMIT_MAX: "50", LOGIN_RATE_LIMIT_WINDOW_MINUTES: "5" });
        const invalid = loadConfig({ ...base, LOGIN_RATE_LIMIT_MAX: "-3", LOGIN_RATE_LIMIT_WINDOW_MINUTES: "abc" });

        assert.deepEqual(custom.loginRateLimit, { limit: 50, windowMs: 5 * 60 * 1000 });
        assert.deepEqual(invalid.loginRateLimit, { limit: 10, windowMs: 15 * 60 * 1000 });
    });

    it("avisa quando o segredo JWT é curto ou de exemplo", () => {
        assert.equal(loadConfig({ ...base, JWT_SECRET: "curto" }).warnings.length, 1);
        assert.equal(loadConfig({ ...base, JWT_SECRET: "ticket_management_secret" }).warnings.length, 1);
    });

    it("interpreta CORS com várias origens e trust proxy", () => {
        const config = loadConfig({
            ...base,
            FRONTEND_URL: "http://a.com, http://b.com",
            TRUST_PROXY: "1",
            PORT: "8080",
            NODE_ENV: "production",
        });

        assert.deepEqual(config.corsOrigins, ["http://a.com", "http://b.com"]);
        assert.equal(config.trustProxy, 1);
        assert.equal(config.port, 8080);
        assert.equal(config.isProduction, true);
    });
});
