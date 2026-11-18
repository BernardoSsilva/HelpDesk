import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import type { Request, Response } from "express";
import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
} from "../../src/domain/errors/domain.error.js";
import { errorHandler } from "../../src/http/errors/error.middleware.js";

function run(error: unknown) {
    const result: { status?: number; body?: unknown } = {};
    const res = {
        headersSent: false,
        status(code: number) {
            result.status = code;
            return this;
        },
        json(body: unknown) {
            result.body = body;
            return this;
        },
    } as unknown as Response;

    errorHandler(error, {} as Request, res, () => assert.fail("não deveria chamar next"));

    return result;
}

describe("errorHandler", () => {
    beforeEach(() => {
        mock.method(console, "error", () => undefined);
    });

    afterEach(() => {
        mock.restoreAll();
    });

    it("traduz erros de domínio para o status HTTP correspondente", () => {
        assert.equal(run(new ValidationError("x")).status, 400);
        assert.equal(run(new UnauthorizedError()).status, 401);
        assert.equal(run(new ForbiddenError()).status, 403);
        assert.equal(run(new NotFoundError()).status, 404);
        assert.equal(run(new ConflictError("x")).status, 409);
    });

    it("inclui os erros por campo quando existem", () => {
        const { body } = run(new ValidationError("Informe o título", [{ field: "title", message: "Informe o título" }]));

        assert.deepEqual(body, {
            code: "VALIDATION",
            message: "Informe o título",
            errors: [{ field: "title", message: "Informe o título" }],
        });
    });

    it("JSON malformado vira 400 sem expor stack", () => {
        const { status, body } = run(Object.assign(new SyntaxError("Unexpected token"), { type: "entity.parse.failed" }));

        assert.equal(status, 400);
        assert.deepEqual(body, { code: "VALIDATION", message: "O corpo da requisição não é um JSON válido" });
    });

    it("mapeia erros conhecidos do Prisma", () => {
        const prismaError = (code: string) => Object.assign(new Error("detalhe interno com SQL"), { code, clientVersion: "7.0.0" });

        assert.equal(run(prismaError("P2002")).status, 409);
        assert.equal(run(prismaError("P2003")).status, 409);
        assert.equal(run(prismaError("P2025")).status, 404);
    });

    it("erro desconhecido vira 500 genérico, sem vazar a mensagem original", () => {
        const { status, body } = run(new Error("connection to 10.0.0.5 refused, password=secret"));

        assert.equal(status, 500);
        assert.deepEqual(body, { code: "INTERNAL", message: "Erro interno do servidor" });
    });
});
