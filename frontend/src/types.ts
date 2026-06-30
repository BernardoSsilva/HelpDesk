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

export type DashboardFilters = {
  endDate?: string;
  priority?: TicketPriority | "";
  requesterId?: string;
  responsibleId?: string;
  search?: string;
  startDate?: string;
  status?: TicketStatus | "";
};

export type DashboardUserOption = Pick<User, "id" | "name">;

export type DashboardTicket = Ticket & {
  requester?: DashboardUserOption;
  responsible?: DashboardUserOption | null;
};

export type DashboardData = {
  filters: {
    endDate: string;
    startDate: string;
  };
  options: {
    requesters: DashboardUserOption[];
    responsibles: DashboardUserOption[];
  };
  recentTickets: DashboardTicket[];
  series: {
    count: number;
    date: string;
    label: string;
  }[];
  stats: {
    changePercent: number;
    previousTotal: number;
    total: number;
  };
  ticketsByPriority: {
    count: number;
    priority: TicketPriority;
  }[];
  ticketsByResponsible: {
    count: number;
    id: string | null;
    name: string;
  }[];
  ticketsByStatus: {
    count: number;
    status: TicketStatus;
  }[];
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
