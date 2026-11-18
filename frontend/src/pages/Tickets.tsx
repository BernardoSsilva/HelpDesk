import {
  Alert,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import { Eye, MoreHorizontal, Plus, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { useMemo, useState, type MouseEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ticketsApi, usersApi } from "../api/client";
import { PriorityBadge, StatusBadge } from "../components/BadgePill";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";
import SelectField from "../components/SelectField";
import { priorityOptions, statusOptions } from "../data/constants";
import { useAsyncData } from "../hooks/useAsyncData";
import { useAuth } from "../state/AuthContext";
import type { DirectoryUser, Ticket, TicketPriority, TicketStatus } from "../types";
import { getErrorMessage } from "../utils/errors";
import { formatDateTime, normalizeText, shortId, statusLabel, userName } from "../utils/formatters";
import { canDeleteTicket, canEditTicket } from "../utils/permissions";

const rowsPerPage = 8;
const noTickets: Ticket[] = [];
const noUsers: DirectoryUser[] = [];

export default function Tickets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [page, setPage] = useState(1);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuTicket, setMenuTicket] = useState<Ticket | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState("");
  const { data: tickets, error, loading, refresh } = useAsyncData(() => ticketsApi.list(), [], noTickets);
  const { data: users } = useAsyncData(() => usersApi.directory(), [], noUsers);

  // A busca vive na URL (?q=), então a busca do topo funciona mesmo estando nesta página e o link é compartilhável.
  const query = searchParams.get("q") ?? "";

  const setQuery = (value: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);

        if (value) {
          next.set("q", value);
        } else {
          next.delete("q");
        }

        return next;
      },
      { replace: true },
    );
    setPage(1);
  };

  const openQuickActions = (event: MouseEvent<HTMLElement>, ticketItem: Ticket) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuTicket(ticketItem);
  };

  const closeQuickActions = () => {
    setMenuAnchor(null);
    setMenuTicket(null);
  };

  const setQuickStatus = async (nextStatus: TicketStatus) => {
    const target = menuTicket;

    closeQuickActions();

    if (!target) {
      return;
    }

    setActionError("");

    try {
      await ticketsApi.update(target.id, { status: nextStatus });
      await refresh();
    } catch (err) {
      setActionError(getErrorMessage(err, "Não foi possível atualizar o ticket."));
    }
  };

  const confirmDelete = async () => {
    if (!ticketToDelete) {
      return;
    }

    setDeleting(true);
    setActionError("");

    try {
      await ticketsApi.remove(ticketToDelete.id);
      setTicketToDelete(null);
      await refresh();
    } catch (err) {
      setTicketToDelete(null);
      setActionError(getErrorMessage(err, "Não foi possível excluir o ticket."));
    } finally {
      setDeleting(false);
    }
  };

  const filteredTickets = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    return tickets.filter((ticketItem) => {
      const matchesQuery = normalizeText(`${ticketItem.title} ${ticketItem.description}`).includes(normalizedQuery);
      const matchesStatus = status ? ticketItem.status === status : true;
      const matchesPriority = priority ? ticketItem.priority === priority : true;

      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [priority, query, status, tickets]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageTickets = filteredTickets.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const clearFilters = () => {
    setStatus("");
    setPriority("");
    setQuery("");
  };

  const canEditMenuTicket = menuTicket ? canEditTicket(user, menuTicket) : false;

  return (
    <div>
      <SectionHeader
        title="Tickets"
        actions={
          <Button startIcon={<Plus className="h-4 w-4" />} variant="contained" onClick={() => navigate("/tickets/new")}>
            Novo Ticket
          </Button>
        }
      />

      {error ? (
        <Alert
          action={
            <Button color="inherit" size="small" onClick={() => void refresh()}>
              Tentar de novo
            </Button>
          }
          className="mb-5"
          severity="error"
        >
          {error}
        </Alert>
      ) : null}

      {actionError ? (
        <Alert className="mb-5" severity="error" onClose={() => setActionError("")}>
          {actionError}
        </Alert>
      ) : null}

      <section className="content-card rounded-md p-5">
        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center">
          <TextField
            className="xl:w-80"
            placeholder="Buscar tickets..."
            size="small"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            slotProps={{
              htmlInput: { "aria-label": "Buscar tickets" },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search className="h-4 w-4" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <SelectField
            emptyLabel="Todos"
            label="Status"
            minWidth={160}
            options={statusOptions}
            value={status}
            onChange={(value) => {
              setStatus(value as TicketStatus | "");
              setPage(1);
            }}
          />

          <SelectField
            emptyLabel="Todas"
            label="Prioridade"
            minWidth={160}
            options={priorityOptions}
            value={priority}
            onChange={(value) => {
              setPriority(value as TicketPriority | "");
              setPage(1);
            }}
          />

          <Button startIcon={<SlidersHorizontal className="h-4 w-4" />} variant="outlined" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>

        {loading && !tickets.length ? (
          <div className="flex items-center justify-center gap-3 py-12 text-sm font-semibold text-slate-500" role="status">
            <CircularProgress size={22} />
            Carregando tickets...
          </div>
        ) : pageTickets.length ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Título</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Prioridade</TableCell>
                    <TableCell>Responsável</TableCell>
                    <TableCell>Solicitante</TableCell>
                    <TableCell>Atualizado em</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageTickets.map((ticketItem) => (
                    <TableRow hover key={ticketItem.id} sx={{ cursor: "pointer" }} onClick={() => navigate(`/tickets/${ticketItem.id}`)}>
                      <TableCell className="font-bold">{shortId(ticketItem.id)}</TableCell>
                      <TableCell>{ticketItem.title}</TableCell>
                      <TableCell>
                        <StatusBadge value={ticketItem.status} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge value={ticketItem.priority} />
                      </TableCell>
                      <TableCell>{userName(users, ticketItem.responsibleId)}</TableCell>
                      <TableCell>{userName(users, ticketItem.requesterId)}</TableCell>
                      <TableCell>{formatDateTime(ticketItem.updatedAt)}</TableCell>
                      <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                        <Tooltip title="Abrir">
                          <IconButton aria-label="Abrir ticket" onClick={() => navigate(`/tickets/${ticketItem.id}`)} size="small">
                            <Eye className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                        {canDeleteTicket(user, ticketItem) ? (
                          <Tooltip title="Excluir">
                            <IconButton aria-label="Excluir ticket" color="error" onClick={() => setTicketToDelete(ticketItem)} size="small">
                              <Trash2 className="h-4 w-4" />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                        <Tooltip title="Mais opções">
                          <IconButton aria-label="Mais opções" size="small" onClick={(event) => openQuickActions(event, ticketItem)}>
                            <MoreHorizontal className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <div className="mt-5 flex justify-center">
              <Pagination color="primary" count={totalPages} page={currentPage} onChange={(_, value) => setPage(value)} />
            </div>
          </>
        ) : (
          <EmptyState title="Nenhum ticket encontrado" description="Ajuste os filtros ou crie um novo ticket para continuar." />
        )}
      </section>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeQuickActions}>
        <MenuItem onClick={() => menuTicket && navigate(`/tickets/${menuTicket.id}`)}>Ver detalhes</MenuItem>
        {canEditMenuTicket
          ? [
              <MenuItem disabled={menuTicket?.status === "RESOLVIDO"} key="resolved" onClick={() => setQuickStatus("RESOLVIDO")}>
                Marcar como {statusLabel("RESOLVIDO").toLowerCase()}
              </MenuItem>,
              <MenuItem disabled={menuTicket?.status === "FECHADO"} key="closed" onClick={() => setQuickStatus("FECHADO")}>
                Marcar como {statusLabel("FECHADO").toLowerCase()}
              </MenuItem>,
            ]
          : null}
      </Menu>

      <ConfirmDialog
        confirmLabel="Excluir"
        description={`Excluir o ticket "${ticketToDelete?.title ?? ""}"? O histórico e os comentários também serão apagados e esta ação não pode ser desfeita.`}
        destructive
        loading={deleting}
        open={Boolean(ticketToDelete)}
        title="Excluir ticket"
        onCancel={() => setTicketToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
