import { ValidationError } from "../../../domain/errors/domain.error.js";

// Funções puras de datas do dashboard (sem acesso a banco), separadas para serem testáveis.
// Todos os cálculos de dia usam UTC para que o resultado não dependa do fuso do servidor.

const dayMs = 24 * 60 * 60 * 1000;

/** Janela máxima do dashboard; evita séries gigantes e consultas caras. */
export const MAX_RANGE_DAYS = 366;

function startOfUtcDay(date: Date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date) {
    return new Date(startOfUtcDay(date).getTime() + dayMs - 1);
}

function countDays(start: Date, end: Date) {
    return Math.round((end.getTime() - start.getTime() + 1) / dayMs);
}

export function toDateKey(date: Date) {
    return date.toISOString().slice(0, 10);
}

function toDayLabel(dateKey: string) {
    const [, month, day] = dateKey.split("-");
    return `${day}/${month}`;
}

export function getRange(filters: { endDate?: Date | undefined; startDate?: Date | undefined }, now = new Date()) {
    const end = endOfUtcDay(filters.endDate ?? now);
    const start = startOfUtcDay(filters.startDate ?? new Date(end.getTime() - 6 * dayMs));

    if (start.getTime() > end.getTime()) {
        throw new ValidationError("A data inicial deve ser anterior ou igual à data final", [
            { field: "startDate", message: "A data inicial deve ser anterior ou igual à data final" },
        ]);
    }

    if (countDays(start, end) > MAX_RANGE_DAYS) {
        throw new ValidationError(`O período máximo permitido é de ${MAX_RANGE_DAYS} dias`, [
            { field: "startDate", message: `O período máximo permitido é de ${MAX_RANGE_DAYS} dias` },
        ]);
    }

    return { end, start };
}

/** Período imediatamente anterior, com exatamente o mesmo número de dias. */
export function getPreviousRange(start: Date, end: Date) {
    const rangeDays = Math.max(1, countDays(start, end));
    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(start.getTime() - rangeDays * dayMs);

    return { previousEnd, previousStart };
}

export function percentageChange(current: number, previous: number) {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }

    return Math.round(((current - previous) / previous) * 100);
}

export function buildDailySeries(createdTickets: { createdAt: Date }[], start: Date, end: Date) {
    const totalsByDate = new Map<string, number>();

    for (let cursor = start.getTime(); cursor <= end.getTime(); cursor += dayMs) {
        totalsByDate.set(toDateKey(new Date(cursor)), 0);
    }

    createdTickets.forEach((ticket) => {
        const key = toDateKey(ticket.createdAt);

        if (totalsByDate.has(key)) {
            totalsByDate.set(key, (totalsByDate.get(key) || 0) + 1);
        }
    });

    return Array.from(totalsByDate.entries()).map(([date, count]) => ({
        count,
        date,
        label: toDayLabel(date),
    }));
}
