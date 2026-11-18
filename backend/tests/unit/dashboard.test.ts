import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ValidationError } from "../../src/domain/errors/domain.error.js";
import {
    MAX_RANGE_DAYS,
    buildDailySeries,
    getPreviousRange,
    getRange,
    percentageChange,
} from "../../src/infrastructure/usecases/dashboard/dashboardRange.js";

const day = (value: string) => new Date(`${value}T00:00:00.000Z`);
const daysBetween = (start: Date, end: Date) => Math.round((end.getTime() - start.getTime() + 1) / 86_400_000);

describe("dashboard", () => {
    describe("getRange", () => {
        it("cobre do início do primeiro dia ao fim do último, em UTC", () => {
            const { start, end } = getRange({ startDate: day("2026-11-12"), endDate: day("2026-11-18") });

            assert.equal(start.toISOString(), "2026-11-12T00:00:00.000Z");
            assert.equal(end.toISOString(), "2026-11-18T23:59:59.999Z");
        });

        it("sem filtros, usa os últimos 7 dias contando hoje", () => {
            const { start, end } = getRange({}, new Date("2026-11-18T15:30:00.000Z"));

            assert.equal(start.toISOString(), "2026-11-12T00:00:00.000Z");
            assert.equal(end.toISOString(), "2026-11-18T23:59:59.999Z");
            assert.equal(daysBetween(start, end), 7);
        });

        it("rejeita início depois do fim", () => {
            assert.throws(() => getRange({ startDate: day("2026-11-18"), endDate: day("2026-11-01") }), ValidationError);
        });

        it(`limita o período a ${MAX_RANGE_DAYS} dias`, () => {
            assert.throws(() => getRange({ startDate: day("1900-01-01"), endDate: day("2026-11-18") }), ValidationError);
            assert.doesNotThrow(() => getRange({ startDate: day("2025-11-18"), endDate: day("2026-11-18") }));
        });
    });

    describe("getPreviousRange", () => {
        it("tem exatamente o mesmo número de dias e termina um instante antes do período atual", () => {
            // Regressão: a versão antiga comparava 7 dias com um período anterior de 8.
            const { start, end } = getRange({ startDate: day("2026-11-12"), endDate: day("2026-11-18") });
            const { previousStart, previousEnd } = getPreviousRange(start, end);

            assert.equal(daysBetween(previousStart, previousEnd), 7);
            assert.equal(previousStart.toISOString(), "2026-11-05T00:00:00.000Z");
            assert.equal(previousEnd.toISOString(), "2026-11-11T23:59:59.999Z");
        });

        it("funciona para um único dia", () => {
            const { start, end } = getRange({ startDate: day("2026-11-18"), endDate: day("2026-11-18") });
            const { previousStart, previousEnd } = getPreviousRange(start, end);

            assert.equal(previousStart.toISOString(), "2026-11-17T00:00:00.000Z");
            assert.equal(previousEnd.toISOString(), "2026-11-17T23:59:59.999Z");
        });
    });

    describe("buildDailySeries", () => {
        it("preenche dias sem tickets com zero e conta os criados em cada dia", () => {
            const { start, end } = getRange({ startDate: day("2026-11-16"), endDate: day("2026-11-18") });
            const series = buildDailySeries(
                [
                    { createdAt: new Date("2026-11-16T03:00:00.000Z") },
                    { createdAt: new Date("2026-11-18T01:00:00.000Z") },
                    { createdAt: new Date("2026-11-18T23:59:00.000Z") },
                ],
                start,
                end,
            );

            assert.deepEqual(series, [
                { date: "2026-11-16", label: "16/11", count: 1 },
                { date: "2026-11-17", label: "17/11", count: 0 },
                { date: "2026-11-18", label: "18/11", count: 2 },
            ]);
        });
    });

    describe("percentageChange", () => {
        it("calcula variação percentual e trata período anterior vazio", () => {
            assert.equal(percentageChange(15, 10), 50);
            assert.equal(percentageChange(5, 10), -50);
            assert.equal(percentageChange(3, 0), 100);
            assert.equal(percentageChange(0, 0), 0);
        });
    });
});
