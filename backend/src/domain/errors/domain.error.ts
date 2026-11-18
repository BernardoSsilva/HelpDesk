/**
 * Erros de negócio. A camada HTTP traduz o `code` para um status HTTP
 * (ver `http/errors/error.middleware.ts`), assim os casos de uso não
 * precisam conhecer detalhes de transporte.
 */
export type DomainErrorCode = "VALIDATION" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT";

export type FieldError = {
    field: string;
    message: string;
};

export class DomainError extends Error {
    constructor(
        message: string,
        public readonly code: DomainErrorCode,
        public readonly fields?: FieldError[],
    ) {
        super(message);
        this.name = new.target.name;
    }
}

export class ValidationError extends DomainError {
    constructor(message: string, fields?: FieldError[]) {
        super(message, "VALIDATION", fields);
    }
}

export class UnauthorizedError extends DomainError {
    constructor(message = "Não autenticado") {
        super(message, "UNAUTHORIZED");
    }
}

export class ForbiddenError extends DomainError {
    constructor(message = "Você não tem permissão para realizar esta ação") {
        super(message, "FORBIDDEN");
    }
}

export class NotFoundError extends DomainError {
    constructor(message = "Recurso não encontrado") {
        super(message, "NOT_FOUND");
    }
}

export class ConflictError extends DomainError {
    constructor(message: string) {
        super(message, "CONFLICT");
    }
}
