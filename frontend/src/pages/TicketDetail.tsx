import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import { ArrowLeft, CheckCircle2, Clock3, MessageSquare, Pencil, RefreshCw, Trash2, UserRound, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ticketsApi, usersApi } from "../api/client";
import { PriorityBadge, StatusBadge } from "../components/BadgePill";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import SelectField from "../components/SelectField";
import { departmentOptions, priorityOptions, statusOptions } from "../data/constants";
import { useAsyncData } from "../hooks/useAsyncData";
import { useAuth } from "../state/AuthContext";
import { useSettings } from "../state/SettingsContext";
import type { DirectoryUser, Ticket, TicketDepartment, TicketHistory, TicketPriority, TicketStatus, UpdateTicketPayload } from "../types";
import { getErrorMessage } from "../utils/errors";
import { departmentLabel, describeHistoryChange, formatDateTime, historyActionTitles, shortId, userName } from "../utils/formatters";
import { canDeleteTicket, canEditTicket } from "../utils/permissions";

type DetailTab = "details" | "history" | "comments";

const noTicket: Ticket | null = null;
const noHistory: TicketHistory[] = [];
const noUsers: DirectoryUser[] = [];

const actionIcon: Partial<Record<TicketHistory["action"], LucideIcon>> = {
  TICKET_CRIADO: CheckCircle2,
  STATUS_ALTERADO: Clock3,
  RESPONSAVEL_ALTERADO: UserRound,
  COMENTARIO_ADICIONADO: MessageSquare,
};

const TITLE_MAX = 150;
const DESCRIPTION_MAX = 5000;
const COMMENT_MAX = 2000;

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const ticketId = id || "";
  const { data: users } = useAsyncData(() => usersApi.directory(), [], noUsers);
  const ticketQuery = useAsyncData(() => ticketsApi.getById(ticketId), [ticketId], noTicket);
  const historyQuery = useAsyncData(() => ticketsApi.history(ticketId), [ticketId], noHistory);
  const [tab, setTab] = useState<DetailTab>("details");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const ticket = ticketQuery.data;
  const history = historyQuery.data;
  const canEdit = ticket ? canEditTicket(user, ticket) : false;
  const canDelete = ticket ? canDeleteTicket(user, ticket) : false;
  const commentsBlocked = ticket?.status === "FECHADO" && !settings.allowClosedComments;

  const refreshAll = async () => {
    await Promise.all([ticketQuery.refresh(), historyQuery.refresh()]);
  };

  /**
   * Executa uma ação que altera o ticket, mostrando o erro da API quando falha.
   * `onSuccess` roda assim que o servidor aceita, antes de recarregar os dados.
   */
  const runAction = async (action: () => Promise<unknown>, fallbackMessage: string, onSuccess?: () => void) => {
    setSaving(true);
    setActionError("");

    try {
      await action();
      onSuccess?.();
      await refreshAll();
      return true;
    } catch (err) {
      setActionError(getErrorMessage(err, fallbackMessage));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateTicket = (payload: UpdateTicketPayload) =>
    runAction(() => ticketsApi.update(ticketId, payload), "Não foi possível atualizar o ticket.");

  const addComment = async () => {
    const text = comment.trim();

    if (!text) {
      return;
    }

    // O rascunho é limpo logo que o servidor aceita o comentário, sem esperar a recarga da tela.
    await runAction(() => ticketsApi.comment(ticketId, text), "Não foi possível adicionar o comentário.", () => setComment(""));
  };

  const openEdit = () => {
    if (!ticket) {
      return;
    }

    setEditTitle(ticket.title);
    setEditDescription(ticket.description);
    setEditError("");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!ticket) {
      return;
    }

    const title = editTitle.trim();
    const description = editDescription.trim();

    if (title.length < 3) {
      setEditError("O título deve ter pelo menos 3 caracteres.");
      return;
    }

    if (!description) {
      setEditError("A descrição não pode ficar vazia.");
      return;
    }

    const payload: UpdateTicketPayload = {};

    if (title !== ticket.title) payload.title = title;
    if (description !== ticket.description) payload.description = description;

    if (!Object.keys(payload).length) {
      setEditOpen(false);
      return;
    }

    setSaving(true);
    setEditError("");

    try {
      await ticketsApi.update(ticketId, payload);
      await refreshAll();
      setEditOpen(false);
    } catch (err) {
      // O erro aparece dentro do diálogo, onde o usuário está olhando.
      setEditError(getErrorMessage(err, "Não foi possível salvar as alterações."));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setSaving(true);

    try {
      await ticketsApi.remove(ticketId);
      navigate("/tickets", { replace: true });
    } catch (err) {
      setDeleteOpen(false);
      setActionError(getErrorMessage(err, "Não foi possível excluir o ticket."));
      setSaving(false);
    }
  };

  // Ticket inexistente (404) ou identificador inválido (400): mostra "não encontrado" em vez de dados de outro ticket.
  if (!ticket && !ticketQuery.loading && (ticketQuery.errorStatus === 404 || ticketQuery.errorStatus === 400)) {
    return (
      <div className="mx-auto max-w-xl py-6">
        <EmptyState title="Ticket não encontrado" description="Ele pode ter sido excluído. Volte para a listagem e selecione outro chamado." />
        <div className="mt-5 flex justify-center">
          <Button startIcon={<ArrowLeft className="h-4 w-4" />} variant="outlined" onClick={() => navigate("/tickets")}>
            Voltar para os tickets
          </Button>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return ticketQuery.error ? (
      <Alert
        action={
          <Button color="inherit" size="small" onClick={() => void refreshAll()}>
            Tentar de novo
          </Button>
        }
        severity="error"
      >
        {ticketQuery.error}
      </Alert>
    ) : (
      <div className="flex items-center justify-center gap-3 py-16 text-sm font-semibold text-slate-500" role="status">
        <CircularProgress size={22} />
        Carregando ticket...
      </div>
    );
  }

  const comments = history.filter((item) => item.action === "COMENTARIO_ADICIONADO").reverse();
  // O histórico vem do mais antigo para o mais recente; a linha do tempo mostra o mais recente primeiro.
  const timeline = [...history].reverse();
  const userOptions = users.map((item) => ({ value: item.id, label: item.name }));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconButton aria-label="Voltar" onClick={() => navigate("/tickets")} size="small">
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
          <h2 className="text-xl font-extrabold text-slate-950">Ticket {shortId(ticket.id)}</h2>
          <StatusBadge value={ticket.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={saving} startIcon={<RefreshCw className="h-4 w-4" />} variant="outlined" onClick={() => void refreshAll()}>
            Atualizar
          </Button>
          {canDelete ? (
            <Button color="error" disabled={saving} startIcon={<Trash2 className="h-4 w-4" />} variant="outlined" onClick={() => setDeleteOpen(true)}>
              Excluir
            </Button>
          ) : null}
        </div>
      </div>

      {ticketQuery.error ? (
        <Alert className="mb-4" severity="error">
          {ticketQuery.error}
        </Alert>
      ) : null}

      {actionError ? (
        <Alert className="mb-4" role="alert" severity="error" onClose={() => setActionError("")}>
          {actionError}
        </Alert>
      ) : null}

      {!canEdit ? (
        <Alert className="mb-4" severity="info">
          Você pode ler e comentar neste ticket, mas apenas administradores, o solicitante e o responsável podem alterá-lo.
        </Alert>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <section className="content-card min-w-0 rounded-md p-6">
          <h3 className="break-words text-2xl font-extrabold text-slate-950">{ticket.title}</h3>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-bold text-slate-500">Solicitante</dt>
              <dd className="mt-1 text-slate-900">{userName(users, ticket.requesterId)}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-500">Departamento</dt>
              <dd className="mt-1 text-slate-900">{departmentLabel(ticket.department, "Não informado")}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-500">Criado em</dt>
              <dd className="mt-1 text-slate-900">{formatDateTime(ticket.createdAt)}</dd>
            </div>
          </dl>

          <Tabs aria-label="Seções do ticket" className="mt-6 border-b border-slate-200" value={tab} onChange={(_, value: DetailTab) => setTab(value)}>
            <Tab label="Detalhes" value="details" />
            <Tab label={`Histórico (${history.length})`} value="history" />
            <Tab label={`Comentários (${comments.length})`} value="comments" />
          </Tabs>

          {tab === "details" ? (
            <div className="mt-5">
              <div className="whitespace-pre-wrap break-words rounded-md bg-slate-50 p-5 text-sm leading-6 text-slate-700">{ticket.description}</div>
              {canEdit ? (
                <div className="mt-3 flex justify-end">
                  <Button disabled={saving} startIcon={<Pencil className="h-4 w-4" />} variant="outlined" onClick={openEdit}>
                    Editar título e descrição
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "history" ? (
            <div className="timeline-line relative mt-5 space-y-5">
              {timeline.length ? (
                timeline.map((item) => {
                  const Icon = actionIcon[item.action] || MessageSquare;

                  return (
                    <div key={item.id} className="relative flex gap-4">
                      <span className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1 border-b border-slate-100 pb-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="text-sm font-extrabold text-slate-950">{historyActionTitles[item.action] || item.action}</h4>
                            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-500">{describeHistoryChange(item, users)}</p>
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
                <EmptyState title="Sem histórico" />
              )}
            </div>
          ) : null}

          {tab === "comments" ? (
            <div className="mt-5">
              {commentsBlocked ? (
                <Alert className="mb-4" severity="info">
                  Comentários em tickets fechados estão desativados nas configurações.
                </Alert>
              ) : (
                <>
                  <TextField
                    fullWidth
                    helperText={`${comment.length}/${COMMENT_MAX}`}
                    label="Novo comentário"
                    minRows={4}
                    multiline
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    slotProps={{ htmlInput: { maxLength: COMMENT_MAX } }}
                  />
                  <div className="mt-3 flex justify-end">
                    <Button disabled={saving || !comment.trim()} startIcon={<MessageSquare className="h-4 w-4" />} variant="contained" onClick={addComment}>
                      Comentar
                    </Button>
                  </div>
                </>
              )}

              <ul className="mt-5 space-y-3">
                {comments.map((item) => (
                  <li key={item.id} className="rounded-md border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-bold text-slate-800">{userName(users, item.changedByUserId)}</span>
                      <span>{formatDateTime(item.createdAt)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">{item.comment}</p>
                  </li>
                ))}
              </ul>

              {!comments.length ? <EmptyState title="Nenhum comentário ainda" description="Seja o primeiro a comentar neste ticket." /> : null}
            </div>
          ) : null}
        </section>

        <aside className="soft-card rounded-md p-5">
          <div className="flex flex-col gap-5">
            <div>
              <p className="mb-2 text-sm font-bold text-slate-500">Prioridade</p>
              <PriorityBadge value={ticket.priority} />
            </div>

            <SelectField
              fullWidth
              disabled={!canEdit || saving}
              label="Status"
              options={statusOptions}
              value={ticket.status}
              onChange={(value) => void updateTicket({ status: value as TicketStatus })}
            />

            <SelectField
              fullWidth
              disabled={!canEdit || saving}
              label="Prioridade"
              options={priorityOptions}
              value={ticket.priority}
              onChange={(value) => void updateTicket({ priority: value as TicketPriority })}
            />

            <SelectField
              fullWidth
              disabled={!canEdit || saving}
              emptyLabel="Não informado"
              label="Departamento"
              options={departmentOptions}
              value={ticket.department ?? ""}
              onChange={(value) => void updateTicket({ department: (value || null) as TicketDepartment | null })}
            />

            <SelectField
              fullWidth
              disabled={!canEdit || saving}
              emptyLabel="Sem responsável"
              label="Responsável"
              options={userOptions}
              value={ticket.responsibleId || ""}
              onChange={(value) => void updateTicket({ responsibleId: value || null })}
            />

            <dl className="space-y-3 border-t border-slate-200 pt-4 text-sm">
              <div>
                <dt className="font-bold text-slate-500">Responsável atual</dt>
                <dd className="mt-1 font-semibold text-slate-950">{ticket.responsibleId ? userName(users, ticket.responsibleId) : "Sem responsável"}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-500">Atualizado em</dt>
                <dd className="mt-1 font-semibold text-slate-950">{formatDateTime(ticket.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      <Dialog fullWidth maxWidth="sm" open={editOpen} onClose={saving ? undefined : () => setEditOpen(false)}>
        <DialogTitle>Editar ticket</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
          {editError ? <Alert severity="error">{editError}</Alert> : null}
          <TextField
            fullWidth
            required
            label="Título"
            size="small"
            value={editTitle}
            onChange={(event) => setEditTitle(event.target.value)}
            slotProps={{ htmlInput: { maxLength: TITLE_MAX } }}
          />
          <TextField
            fullWidth
            required
            label="Descrição"
            minRows={5}
            multiline
            value={editDescription}
            onChange={(event) => setEditDescription(event.target.value)}
            slotProps={{ htmlInput: { maxLength: DESCRIPTION_MAX } }}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setEditOpen(false)}>
            Cancelar
          </Button>
          <Button disabled={saving} variant="contained" onClick={saveEdit}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        confirmLabel="Excluir"
        description="O histórico e os comentários deste ticket também serão apagados. Esta ação não pode ser desfeita."
        destructive
        loading={saving}
        open={deleteOpen}
        title="Excluir ticket"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
