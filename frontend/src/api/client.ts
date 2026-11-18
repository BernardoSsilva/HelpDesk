import axios from "axios";
import type {
  AuthResponse,
  ChangePasswordPayload,
  CreateTicketPayload,
  CreateUserPayload,
  DashboardData,
  DashboardFilters,
  DirectoryUser,
  LoginPayload,
  Ticket,
  TicketHistory,
  UpdateTicketPayload,
  UpdateUserPayload,
  User,
} from "../types";
import { readToken } from "../utils/storage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api-backend";
const LOGIN_PATH = "/users/auth";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

let onUnauthorized: (() => void) | null = null;

/** Registra o que fazer quando a API recusa o token (o AuthProvider encerra a sessão). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  const token = readToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Um 401 no próprio login significa "credenciais inválidas", não "sessão expirada".
    if (error.response?.status === 401 && error.config?.url !== LOGIN_PATH) {
      onUnauthorized?.();
    }

    return Promise.reject(error);
  },
);

export const authApi = {
  login: (payload: LoginPayload) => api.post<AuthResponse>(LOGIN_PATH, payload).then((res) => res.data),
};

export const dashboardApi = {
  get: (filters: DashboardFilters) => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => Boolean(value)));

    return api.get<DashboardData>("/dashboard", { params }).then((res) => res.data);
  },
};

export const ticketsApi = {
  list: () => api.get<Ticket[]>("/tickets").then((res) => res.data),
  listMine: (userId: string) => api.get<Ticket[]>(`/tickets/requester/${userId}`).then((res) => res.data),
  listResponsible: (userId: string) => api.get<Ticket[]>(`/tickets/responsible/${userId}`).then((res) => res.data),
  getById: (id: string) => api.get<Ticket>(`/tickets/${id}`).then((res) => res.data),
  create: (payload: CreateTicketPayload) => api.post<Ticket>("/tickets", payload).then((res) => res.data),
  update: (id: string, payload: UpdateTicketPayload) => api.put<Ticket>(`/tickets/${id}`, payload).then((res) => res.data),
  remove: (id: string) => api.delete<void>(`/tickets/${id}`).then((res) => res.data),
  history: (id: string) => api.get<TicketHistory[]>(`/tickets/${id}/history`).then((res) => res.data),
  comment: (id: string, comment: string) => api.post<TicketHistory>(`/tickets/${id}/comments`, { comment }).then((res) => res.data),
};

export const usersApi = {
  /** Lista completa (com e-mail e perfil); restrita a administradores. */
  list: () => api.get<User[]>("/users").then((res) => res.data),
  /** Id e nome de todos os usuários; disponível para qualquer usuário autenticado. */
  directory: () => api.get<DirectoryUser[]>("/users/directory").then((res) => res.data),
  me: () => api.get<User>("/users/me").then((res) => res.data),
  changePassword: (payload: ChangePasswordPayload) => api.put<void>("/users/me/password", payload).then((res) => res.data),
  create: (payload: CreateUserPayload) => api.post<User>("/users", payload).then((res) => res.data),
  update: (id: string, payload: UpdateUserPayload) => api.put<User>(`/users/${id}`, payload).then((res) => res.data),
  remove: (id: string) => api.delete<void>(`/users/${id}`).then((res) => res.data),
};
