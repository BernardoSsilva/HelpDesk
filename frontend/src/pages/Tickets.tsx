import {
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { Eye, MoreHorizontal, Plus, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ticketsApi, usersApi } from "../api/client";
import { PriorityBadge, StatusBadge } from "../components/BadgePill";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";
import { priorityOptions, statusOptions } from "../data/constants";
import { fallbackTickets, fallbackUsers } from "../data/fallback";
import { useAsyncData } from "../hooks/useAsyncData";
import { formatDateTime, normalizeText, shortId, userName } from "../utils/formatters";
import type { TicketPriority, TicketStatus } from "../types";

const rowsPerPage = 8;

export default function Tickets() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [page, setPage] = useState(1);
  const { data: tickets, refresh } = useAsyncData(() => ticketsApi.list(), [], fallbackTickets);
  const { data: users } = useAsyncData(() => usersApi.list(), [], fallbackUsers);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticketItem) => {
      const matchesQuery = normalizeText(`${ticketItem.title} ${ticketItem.description}`).includes(normalizeText(query));
      const matchesStatus = status ? ticketItem.status === status : true;
      const matchesPriority = priority ? ticketItem.priority === priority : true;

      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [priority, query, status, tickets]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / rowsPerPage));
  const pageTickets = filteredTickets.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const clearFilters = () => {
    setQuery("");
    setStatus("");
    setPriority("");
    setPage(1);
  };

  const removeTicket = async (id: string) => {
    await ticketsApi.remove(id);
    refresh();
  };

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

      <section className="content-card rounded-md p-5">
        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center">
          <TextField
            className="xl:w-80"
            placeholder="Buscar tickets..."
            size="small"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search className="h-4 w-4" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={status} onChange={(event: SelectChangeEvent) => setStatus(event.target.value as TicketStatus | "")}>
              <MenuItem value="">Todos</MenuItem>
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Prioridade</InputLabel>
            <Select label="Prioridade" value={priority} onChange={(event: SelectChangeEvent) => setPriority(event.target.value as TicketPriority | "")}>
              <MenuItem value="">Todas</MenuItem>
              {priorityOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button startIcon={<SlidersHorizontal className="h-4 w-4" />} variant="outlined" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>

        {pageTickets.length ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Titulo</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Prioridade</TableCell>
                    <TableCell>Responsavel</TableCell>
                    <TableCell>Solicitante</TableCell>
                    <TableCell>Atualizado em</TableCell>
                    <TableCell align="right">Acoes</TableCell>
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
                          <IconButton onClick={() => navigate(`/tickets/${ticketItem.id}`)} size="small">
                            <Eye className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton color="error" onClick={() => removeTicket(ticketItem.id)} size="small">
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Mais opcoes">
                          <IconButton size="small">
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
              <Pagination color="primary" count={totalPages} page={page} onChange={(_, value) => setPage(value)} />
            </div>
          </>
        ) : (
          <EmptyState title="Nenhum ticket encontrado" description="Ajuste os filtros ou crie um novo ticket para continuar." />
        )}
      </section>
    </div>
  );
}
