import { priorityOptions, statusOptions } from "../data/constants";
import { priorityLabel, statusLabel } from "../utils/formatters";
import type { TicketPriority, TicketStatus } from "../types";

const statusClasses: Record<TicketStatus, string> = {
  ABERTO: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  EM_ANDAMENTO: "bg-blue-50 text-blue-700 ring-blue-200",
  AGUARDANDO: "bg-amber-50 text-amber-700 ring-amber-200",
  RESOLVIDO: "bg-green-50 text-green-700 ring-green-200",
  FECHADO: "bg-slate-100 text-slate-600 ring-slate-200",
};

const priorityClasses: Record<TicketPriority, string> = {
  BAIXA: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  MEDIA: "bg-amber-50 text-amber-700 ring-amber-200",
  ALTA: "bg-red-50 text-red-700 ring-red-200",
  CRITICA: "bg-violet-50 text-violet-700 ring-violet-200",
};

export function StatusBadge({ value }: { value: TicketStatus }) {
  const Icon = statusOptions.find((item) => item.value === value)?.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-extrabold ring-1 ${statusClasses[value] || statusClasses.FECHADO}`}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {statusLabel(value).toUpperCase()}
    </span>
  );
}

export function PriorityBadge({ value }: { value: TicketPriority }) {
  const colorClass = priorityClasses[value] || priorityClasses.MEDIA;
  const label = priorityOptions.find((item) => item.value === value)?.label || priorityLabel(value);

  return <span className={`inline-flex rounded px-2 py-1 text-xs font-extrabold ring-1 ${colorClass}`}>{label.toUpperCase()}</span>;
}
