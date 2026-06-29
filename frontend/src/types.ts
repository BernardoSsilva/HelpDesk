import type { LucideIcon } from "lucide-react";

export type TicketStatus = "ABERTO" | "EM_ANDAMENTO" | "AGUARDANDO" | "RESOLVIDO" | "FECHADO";
export type TicketPriority = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
export type UserRole = "ADMIN" | "USER";
export type TicketHistoryAction =
  | "TICKET_CRIADO"
  | "STATUS_ALTERADO"
  | "RESPONSAVEL_ALTERADO"
  | "TITULO_ALTERADO"
  | "DESCRICAO_ALTERADA"
  | "PRIORIDADE_ALTERADA"
  | "COMENTARIO_ADICIONADO";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
};

export type Ticket = {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  requesterId: string;
  responsibleId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TicketHistory = {
  id: string;
  ticketId?: string;
  action: TicketHistoryAction;
  changedByUserId: string;
  previousValue?: string | null;
  newValue?: string | null;
  comment?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type LoginPayload = {
  userEmail: string;
  password: string;
};

export type CreateTicketPayload = {
  title: string;
  description: string;
  priority: TicketPriority;
  requesterId?: string;
  responsibleId?: string | null;
};

export type UpdateTicketPayload = Partial<Pick<Ticket, "title" | "description" | "priority" | "status" | "responsibleId">> & {
  comment?: string;
};

export type CreateUserPayload = {
  userName: string;
  userEmail: string;
  password: string;
  userRole: UserRole;
};

export type UpdateUserPayload = Partial<CreateUserPayload>;

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
  color?: string;
  icon?: LucideIcon;
};
