import { Alert, Button, FormControl, IconButton, InputLabel, MenuItem, Select, Tab, Tabs, TextField } from "@mui/material";
import { ArrowLeft, CheckCircle2, Clock3, MessageSquare, Save, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ticketsApi, usersApi } from "../api/client";
import { PriorityBadge, StatusBadge } from "../components/BadgePill";
import EmptyState from "../components/EmptyState";
import { priorityOptions, statusOptions } from "../data/constants";
import { fallbackHistory, fallbackTickets, fallbackUsers } from "../data/fallback";
import { useAsyncData } from "../hooks/useAsyncData";
import { formatDateTime, priorityLabel, shortId, statusLabel, userName } from "../utils/formatters";
import type { TicketHistory, UpdateTicketPayload } from "../types";
import type { LucideIcon } from "lucide-react";

const actionIcon: Partial<Record<TicketHistory["action"], LucideIcon>> = {
  TICKET_CRIADO: CheckCircle2,
  STATUS_ALTERADO: Clock3,
  RESPONSAVEL_ALTERADO: UserRound,
  COMENTARIO_ADICIONADO: MessageSquare,
};

function actionTitle(item: TicketHistory) {
  const labels: Record<TicketHistory["action"], string> = {
    TICKET_CRIADO: "Ticket criado",
    STATUS_ALTERADO: "Status alterado",
    RESPONSAVEL_ALTERADO: "Responsavel alterado",
    TITULO_ALTERADO: "Titulo alterado",
    DESCRICAO_ALTERADA: "Descricao alterada",
    PRIORIDADE_ALTERADA: "Prioridade alterada",
    COMENTARIO_ADICIONADO: "Comentario adicionado",
  };

  return labels[item.action] || item.action;
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ticketId = id || "";
  const { data: users } = useAsyncData(() => usersApi.list(), [], fallbackUsers);
  const { data: tickets } = useAsyncData(() => ticketsApi.list(), [], fallbackTickets);
  const fallbackTicket = tickets.find((ticketItem) => ticketItem.id === ticketId) || fallbackTickets[0];
  const { data: ticket, error, refresh } = useAsyncData(() => ticketsApi.getById(ticketId), [ticketId], fallbackTicket);
  const { data: history, refresh: refreshHistory } = useAsyncData(() => ticketsApi.history(ticketId), [ticketId], fallbackHistory);
  const [tab, setTab] = useState(1);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const currentTicket = ticket || fallbackTicket;
  const requester = useMemo(() => userName(users, currentTicket?.requesterId), [currentTicket?.requesterId, users]);
  const responsible = useMemo(() => userName(users, currentTicket?.responsibleId), [currentTicket?.responsibleId, users]);

  const updateTicket = async (payload: UpdateTicketPayload) => {
    setSaving(true);

    try {
      await ticketsApi.update(ticketId, payload);
      await refresh();
      await refreshHistory();
    } finally {
      setSaving(false);
    }
  };

  const addComment = async () => {
    if (!comment.trim()) {
      return;
    }

    setSaving(true);

    try {
      await ticketsApi.comment(ticketId, comment.trim());
      setComment("");
      await refreshHistory();
    } finally {
      setSaving(false);
    }
  };

  if (!currentTicket) {
    return <EmptyState title="Ticket nao encontrado" description="Volte para a listagem e selecione outro chamado." />;
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconButton onClick={() => navigate("/tickets")} size="small">
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
          <h1 className="text-xl font-extrabold text-slate-950">Ticket {shortId(currentTicket.id)}</h1>
          <StatusBadge value={currentTicket.status} />
        </div>
        <Button disabled={saving} startIcon={<Save className="h-4 w-4" />} variant="outlined" onClick={() => refresh()}>
          Atualizar
        </Button>
      </div>

      {error ? (
        <Alert className="mb-4" severity="info">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <section className="content-card rounded-md p-6">
          <h2 className="text-2xl font-extrabold text-slate-950">{currentTicket.title}</h2>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-bold text-slate-500">Solicitante</dt>
              <dd className="mt-1 text-slate-900">{requester}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-500">Departamento</dt>
              <dd className="mt-1 text-slate-900">TI</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-500">Criado em</dt>
              <dd className="mt-1 text-slate-900">{formatDateTime(currentTicket.createdAt)}</dd>
            </div>
          </dl>

          <Tabs className="mt-6 border-b border-slate-200" value={tab} onChange={(_, value) => setTab(value)}>
            <Tab label="Detalhes" />
            <Tab label="Historico" />
            <Tab label="Comentarios" />
          </Tabs>

          {tab === 0 ? (
            <div className="mt-5 rounded-md bg-slate-50 p-5 text-sm leading-6 text-slate-700">{currentTicket.description}</div>
          ) : null}

          {tab === 1 ? (
            <div className="timeline-line relative mt-5 space-y-5">
              {history.length ? (
                history.map((item) => {
                  const Icon = actionIcon[item.action] || MessageSquare;

                  return (
                    <div key={item.id} className="relative flex gap-4">
                      <span className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1 border-b border-slate-100 pb-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-950">{actionTitle(item)}</h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {item.comment ||
                                [item.previousValue ? statusLabel(item.previousValue) : "-", item.newValue ? statusLabel(item.newValue) : "-"].join(" -> ")}
                            </p>
                          </div>
                          <div className="text-right text-xs text-slate-500">
                            <p>{userName(users, item.changedByUserId)}</p>
                            <p>{formatDateTime(item.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState title="Sem historico" />
              )}
            </div>
          ) : null}

          {tab === 2 ? (
            <div className="mt-5">
              <TextField
                fullWidth
                label="Novo comentario"
                minRows={4}
                multiline
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
              <div className="mt-3 flex justify-end">
                <Button disabled={saving} startIcon={<MessageSquare className="h-4 w-4" />} variant="contained" onClick={addComment}>
                  Comentar
                </Button>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="soft-card rounded-md p-5">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-bold text-slate-500">Prioridade</p>
              <PriorityBadge value={currentTicket.priority} />
            </div>

            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={currentTicket.status} onChange={(event) => updateTicket({ status: event.target.value })}>
                {statusOptions.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Prioridade</InputLabel>
              <Select label="Prioridade" value={currentTicket.priority} onChange={(event) => updateTicket({ priority: event.target.value })}>
                {priorityOptions.map((priority) => (
                  <MenuItem key={priority.value} value={priority.value}>
                    {priorityLabel(priority.value)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Responsavel</InputLabel>
              <Select label="Responsavel" value={currentTicket.responsibleId || ""} onChange={(event) => updateTicket({ responsibleId: event.target.value || null })}>
                <MenuItem value="">Sem responsavel</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <dl className="space-y-3 border-t border-slate-200 pt-4 text-sm">
              <div>
                <dt className="font-bold text-slate-500">Responsavel atual</dt>
                <dd className="mt-1 font-semibold text-slate-950">{responsible}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500">Atualizado em</dt>
                <dd className="mt-1 font-semibold text-slate-950">{formatDateTime(currentTicket.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
