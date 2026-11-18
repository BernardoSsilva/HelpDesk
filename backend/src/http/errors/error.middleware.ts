import type { ErrorRequestHandler, RequestHandler } from "express";
import { DomainError, type DomainErrorCode } from "../../domain/errors/domain.error.js";
import { isPrismaError } from "../../infrastructure/prisma.errors.js";

const statusByCode: Record<DomainErrorCode, number> = {
    VALIDATION: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
};

export const notFoundHandler: RequestHandler = (_req, res) => {
    res.status(404).json({ code: "NOT_FOUND", message: "Rota não encontrada" });
};

type HttpLikeError = {
    status?: unknown;
    type?: unknown;
    expose?: unknown;
};

/**
 * Único ponto que converte exceções em respostas HTTP. Detalhes internos
 * (SQL, stack, caminhos de arquivo) nunca chegam ao cliente: ficam no log.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) {
        next(error);
        return;
    }

    if (error instanceof DomainError) {
        res.status(statusByCode[error.code]).json({
            code: error.code,
            message: error.message,
            ...(error.fields?.length ? { errors: error.fields } : {}),
        });
        return;
    }

    // Erros do body-parser (JSON malformado, corpo grande demais).
    const httpError = (typeof error === "object" && error !== null ? error : {}) as HttpLikeError;

    if (httpError.type === "entity.parse.failed") {
        res.status(400).json({ code: "VALIDATION", message: "O corpo da requisição não é um JSON válido" });
        return;
    }

    if (httpError.type === "entity.too.large") {
        res.status(413).json({ code: "PAYLOAD_TOO_LARGE", message: "O corpo da requisição é grande demais" });
        return;
    }

    if (isPrismaError(error, "P2002")) {
        res.status(409).json({ code: "CONFLICT", message: "Já existe um registro com estes dados" });
        return;
    }

    if (isPrismaError(error, "P2003")) {
        res.status(409).json({ code: "CONFLICT", message: "A operação referencia ou depende de outros registros" });
        return;
    }

    if (isPrismaError(error, "P2025")) {
        res.status(404).json({ code: "NOT_FOUND", message: "Registro não encontrado" });
        return;
    }

    console.error("Erro não tratado:", error);
    res.status(500).json({ code: "INTERNAL", message: "Erro interno do servidor" });
};
