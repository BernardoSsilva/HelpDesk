import { departmentOptions, priorityOptions, statusOptions } from "../data/constants";
import type { DirectoryUser, SelectOption, TicketHistory } from "../types";

export function labelFrom<T extends string>(options: SelectOption<T>[], value?: T | string | null) {
  return options.find((option) => option.value === value)?.label || value || "-";
}

export function statusLabel(value?: string | null) {
  return labelFrom(statusOptions, value);
}

export function priorityLabel(value?: string | null) {
  return labelFrom(priorityOptions, value);
}

export function departmentLabel(value?: string | null, empty = "-") {
  return value ? labelFrom(departmentOptions, value) : empty;
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function shortId(id?: string | null) {
  if (!id) {
    return "-";
  }

  if (/^\d+$/.test(id)) {
    return `#${id}`;
  }

  return `#${id.slice(0, 4).toUpperCase()}`;
}

export function userName(users: DirectoryUser[], id?: string | null) {
  return users.find((user) => user.id === id)?.name || "-";
}

export function normalizeText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export const historyActionTitles: Record<TicketHistory["action"], string> = {
  TICKET_CRIADO: "Ticket criado",
  STATUS_ALTERADO: "Status alterado",
  RESPONSAVEL_ALTERADO: "Responsável alterado",
  TITULO_ALTERADO: "Título alterado",
  DESCRICAO_ALTERADA: "Descrição alterada",
  PRIORIDADE_ALTERADA: "Prioridade alterada",
  DEPARTAMENTO_ALTERADO: "Departamento alterado",
  COMENTARIO_ADICIONADO: "Comentário adicionado",
};

/** Texto legível da mudança registrada, com cada valor formatado conforme o tipo de ação. */
export function describeHistoryChange(item: TicketHistory, users: DirectoryUser[]) {
  const before = item.previousValue ?? null;
  const after = item.newValue ?? null;
  const change = (from: string, to: string) => `${from} → ${to}`;
  const person = (id: string | null) => (id ? userName(users, id) : "Sem responsável");

  switch (item.action) {
    case "TICKET_CRIADO":
      return item.comment || "Ticket criado";
    case "COMENTARIO_ADICIONADO":
      return item.comment || "";
    case "STATUS_ALTERADO":
      return change(statusLabel(before), statusLabel(after));
    case "PRIORIDADE_ALTERADA":
      return change(priorityLabel(before), priorityLabel(after));
    case "DEPARTAMENTO_ALTERADO":
      return change(departmentLabel(before, "Não informado"), departmentLabel(after, "Não informado"));
    case "RESPONSAVEL_ALTERADO":
      return change(person(before), person(after));
    case "TITULO_ALTERADO":
      return change(`"${before ?? ""}"`, `"${after ?? ""}"`);
    case "DESCRICAO_ALTERADA":
      return "A descrição foi atualizada";
    default:
      return item.comment || "";
  }
}
