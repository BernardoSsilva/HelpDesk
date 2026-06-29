import {
  Activity,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  PauseCircle,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import type { SelectOption, TicketPriority, TicketStatus, UserRole } from "../types";

export const statusOptions: SelectOption<TicketStatus>[] = [
  { value: "ABERTO", label: "Aberto", color: "blue", icon: Ticket },
  { value: "EM_ANDAMENTO", label: "Em andamento", color: "indigo", icon: Activity },
  { value: "AGUARDANDO", label: "Aguardando", color: "amber", icon: Clock3 },
  { value: "RESOLVIDO", label: "Resolvido", color: "emerald", icon: CheckCircle2 },
  { value: "FECHADO", label: "Fechado", color: "slate", icon: LockKeyhole },
];

export const priorityOptions: SelectOption<TicketPriority>[] = [
  { value: "CRITICA", label: "Crítica", color: "violet" },
  { value: "ALTA", label: "Alta", color: "red" },
  { value: "MEDIA", label: "Média", color: "amber" },
  { value: "BAIXA", label: "Baixa", color: "emerald" },
];

export const roleOptions: SelectOption<UserRole>[] = [
  { value: "ADMIN", label: "Admin", icon: ShieldCheck },
  { value: "USER", label: "User", icon: PauseCircle },
];

export const departmentOptions = ["TI", "Financeiro", "RH", "Operações", "Outros"];
