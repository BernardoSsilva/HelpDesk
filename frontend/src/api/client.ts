import axios from "axios";
import type {
  AuthResponse,
  CreateTicketPayload,
  CreateUserPayload,
  LoginPayload,
  Ticket,
  TicketHistory,
  UpdateTicketPayload,
  UpdateUserPayload,
  User,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api-backend";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("helpdesk_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("helpdesk_token");
      localStorage.removeItem("helpdesk_user");
    }

    return Promise.reject(error);
  },
);

export const authApi = {
  login: (payload: LoginPayload) => api.post<AuthResponse>("/users/auth", payload).then((res) => res.data),
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
  list: () => api.get<User[]>("/users").then((res) => res.data),
  create: (payload: CreateUserPayload) => api.post<User>("/users", payload).then((res) => res.data),
  update: (id: string, payload: UpdateUserPayload) => api.put<User>(`/users/${id}`, payload).then((res) => res.data),
  remove: (id: string) => api.delete<void>(`/users/${id}`).then((res) => res.data),
};
