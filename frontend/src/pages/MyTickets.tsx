import { Alert, Button, CircularProgress, Tab, Tabs } from "@mui/material";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ticketsApi } from "../api/client";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";
import { PriorityBadge, StatusBadge } from "../components/BadgePill";
import { useAsyncData } from "../hooks/useAsyncData";
import { useAuth } from "../state/AuthContext";
import type { Ticket } from "../types";
import { formatDateTime, shortId } from "../utils/formatters";

type MyTicketsTab = "requested" | "assigned";

const noTickets: Ticket[] = [];

const emptyMessages: Record<MyTicketsTab, { title: string; description: string }> = {
  requested: { title: "Você ainda não abriu tickets", description: "Crie uma solicitação para acompanhar por aqui." },
  assigned: { title: "Nenhum ticket atribuído a você", description: "Os tickets em que você for o responsável aparecerão aqui." },
};

export default function MyTickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;
  const [tab, setTab] = useState<MyTicketsTab>("requested");
  const requested = useAsyncData(() => (userId ? ticketsApi.listMine(userId) : Promise.resolve(noTickets)), [userId], noTickets);
  const assigned = useAsyncData(() => (userId ? ticketsApi.listResponsible(userId) : Promise.resolve(noTickets)), [userId], noTickets);

  const current = tab === "requested" ? requested : assigned;
  const tickets = current.data;

  return (
    <div>
      <SectionHeader
        title="Meus Tickets"
        actions={
          <Button startIcon={<Plus className="h-4 w-4" />} variant="contained" onClick={() => navigate("/tickets/new")}>
            Criar Ticket
          </Button>
        }
      />

      <Tabs aria-label="Meus tickets" className="mb-5 border-b border-slate-200" value={tab} onChange={(_, value: MyTicketsTab) => setTab(value)}>
        <Tab label={`Abertos por mim${requested.loading ? "" : ` (${requested.data.length})`}`} value="requested" />
        <Tab label={`Atribuídos a mim${assigned.loading ? "" : ` (${assigned.data.length})`}`} value="assigned" />
      </Tabs>

      {current.error ? (
        <Alert
          action={
            <Button color="inherit" size="small" onClick={() => void current.refresh()}>
              Tentar de novo
            </Button>
          }
          className="mb-5"
          severity="error"
        >
          {current.error}
        </Alert>
      ) : null}

      {current.loading && !tickets.length ? (
        <div className="flex items-center justify-center gap-3 py-12 text-sm font-semibold text-slate-500" role="status">
          <CircularProgress size={22} />
          Carregando tickets...
        </div>
      ) : tickets.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {tickets.map((ticketItem) => (
            <button
              key={ticketItem.id}
              className="soft-card rounded-md p-5 text-left transition hover:-translate-y-0.5 hover:shadow-xl"
              type="button"
              onClick={() => navigate(`/tickets/${ticketItem.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-blue-600">{shortId(ticketItem.id)}</p>
                  <h2 className="mt-1 text-lg font-extrabold text-slate-950">{ticketItem.title}</h2>
                </div>
                <StatusBadge value={ticketItem.status} />
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-500">{ticketItem.description}</p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <PriorityBadge value={ticketItem.priority} />
                <span className="text-sm text-slate-500">{formatDateTime(ticketItem.updatedAt)}</span>
              </div>
            </button>
          ))}
        </div>
      ) : current.error ? null : (
        <EmptyState {...emptyMessages[tab]} />
      )}
    </div>
  );
}
