/**
 * Identifica erros conhecidos do Prisma pelo código, sem depender de
 * `instanceof` (o que falha quando há mais de uma cópia do client carregada).
 *
 * P2002: violação de unicidade · P2003: violação de chave estrangeira
 * P2025: registro não encontrado
 */
export function isPrismaError(error: unknown, code: "P2002" | "P2003" | "P2025") {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: unknown }).code === code &&
        "clientVersion" in error
    );
}
