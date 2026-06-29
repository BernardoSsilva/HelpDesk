import { priorityOptions, statusOptions } from "../data/constants";
import type { SelectOption, User } from "../types";

export function labelFrom<T extends string>(options: SelectOption<T>[], value?: T | string | null) {
  return options.find((option) => option.value === value)?.label || value || "-";
}

export function statusLabel(value?: string | null) {
  return labelFrom(statusOptions, value);
}

export function priorityLabel(value?: string | null) {
  return labelFrom(priorityOptions, value);
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

export function userName(users: User[], id?: string | null) {
  return users.find((user) => user.id === id)?.name || "-";
}

export function normalizeText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
