import { describe, expect, it } from "vitest";
import type { TicketHistory } from "../types";
import { departmentLabel, describeHistoryChange, normalizeText, priorityLabel, shortId, statusLabel, userName } from "./formatters";

const users = [
  { id: "u1", name: "Ana Souza" },
  { id: "u2", name: "Bruno Lima" },
];

function entry(overrides: Partial<TicketHistory>): TicketHistory {
  return {
    id: "h",
    action: "STATUS_ALTERADO",
    changedByUserId: "u1",
    createdAt: "2026-11-18T10:00:00.000Z",
    ...overrides,
  };
}

describe("describeHistoryChange", () => {
  it("status e prioridade usam os rótulos, não os códigos", () => {
    expect(describeHistoryChange(entry({ action: "STATUS_ALTERADO", previousValue: "ABERTO", newValue: "EM_ANDAMENTO" }), users)).toBe(
      "Aberto → Em andamento",
    );
    expect(describeHistoryChange(entry({ action: "PRIORIDADE_ALTERADA", previousValue: "MEDIA", newValue: "CRITICA" }), users)).toBe("Média → Crítica");
  });

  it("responsável mostra nomes (e não UUIDs), incluindo remoção", () => {
    expect(describeHistoryChange(entry({ action: "RESPONSAVEL_ALTERADO", previousValue: "u1", newValue: "u2" }), users)).toBe(
      "Ana Souza → Bruno Lima",
    );
    expect(describeHistoryChange(entry({ action: "RESPONSAVEL_ALTERADO", previousValue: null, newValue: "u1" }), users)).toBe(
      "Sem responsável → Ana Souza",
    );
    expect(describeHistoryChange(entry({ action: "RESPONSAVEL_ALTERADO", previousValue: "u2", newValue: null }), users)).toBe(
      "Bruno Lima → Sem responsável",
    );
  });

  it("departamento usa rótulos e trata ausência", () => {
    expect(describeHistoryChange(entry({ action: "DEPARTAMENTO_ALTERADO", previousValue: null, newValue: "OPERACOES" }), users)).toBe(
      "Não informado → Operações",
    );
  });

  it("título entre aspas, descrição genérica e comentários literais", () => {
    expect(describeHistoryChange(entry({ action: "TITULO_ALTERADO", previousValue: "A", newValue: "B" }), users)).toBe('"A" → "B"');
    expect(describeHistoryChange(entry({ action: "DESCRICAO_ALTERADA", previousValue: "longo", newValue: "outro longo" }), users)).toBe(
      "A descrição foi atualizada",
    );
    expect(describeHistoryChange(entry({ action: "COMENTARIO_ADICIONADO", comment: "Olá" }), users)).toBe("Olá");
    expect(describeHistoryChange(entry({ action: "TICKET_CRIADO", comment: "Ticket criado" }), users)).toBe("Ticket criado");
  });
});

describe("formatters", () => {
  it("rótulos conhecidos e fallback para o próprio valor", () => {
    expect(statusLabel("AGUARDANDO")).toBe("Aguardando");
    expect(priorityLabel("ALTA")).toBe("Alta");
    expect(statusLabel("DESCONHECIDO")).toBe("DESCONHECIDO");
    expect(statusLabel(null)).toBe("-");
  });

  it("departamento vazio usa o texto informado", () => {
    expect(departmentLabel("FINANCEIRO")).toBe("Financeiro");
    expect(departmentLabel(null)).toBe("-");
    expect(departmentLabel(undefined, "Não informado")).toBe("Não informado");
  });

  it("shortId abrevia UUIDs e preserva números", () => {
    expect(shortId("be09aaaa-1111-4111-8111-111111111111")).toBe("#BE09");
    expect(shortId("128")).toBe("#128");
    expect(shortId(null)).toBe("-");
  });

  it("userName devolve '-' para id ausente ou desconhecido", () => {
    expect(userName(users, "u2")).toBe("Bruno Lima");
    expect(userName(users, "nope")).toBe("-");
    expect(userName(users, null)).toBe("-");
  });

  it("normalizeText ignora acentos e caixa (busca tolerante)", () => {
    expect(normalizeText("Impressão Média")).toBe("impressao media");
    expect(normalizeText("impressao").includes(normalizeText("IMPRESSÃO"))).toBe(true);
  });
});
