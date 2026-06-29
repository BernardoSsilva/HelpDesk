import { Button } from "@mui/material";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ticketsApi } from "../api/client";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";
import { PriorityBadge, StatusBadge } from "../components/BadgePill";
import { fallbackTickets } from "../data/fallback";
import { useAsyncData } from "../hooks/useAsyncData";
import { useAuth } from "../state/AuthContext";
import { formatDateTime, shortId } from "../utils/formatters";

export default function MyTickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: tickets } = useAsyncData(() => (user?.id ? ticketsApi.listMine(user.id) : Promise.resolve([])), [user?.id], fallbackTickets.slice(0, 4));

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

      {tickets.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {tickets.map((ticketItem) => (
            <button key={ticketItem.id} className="soft-card rounded-md p-5 text-left transition hover:-translate-y-0.5 hover:shadow-xl" onClick={() => navigate(`/tickets/${ticketItem.id}`)}>
              <div className="flex items-start justify-between gap-4">
                <div>
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
      ) : (
        <EmptyState title="Voce ainda nao tem tickets" description="Crie uma solicitacao para acompanhar por aqui." />
      )}
    </div>
  );
}
