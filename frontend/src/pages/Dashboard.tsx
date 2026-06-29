import { CheckCircle2, Clock3, LockKeyhole, PauseCircle, Ticket, TimerReset } from "lucide-react";
import { ticketsApi } from "../api/client";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";
import StatCard from "../components/StatCard";
import { StatusBadge } from "../components/BadgePill";
import { priorityOptions, statusOptions } from "../data/constants";
import { fallbackTickets } from "../data/fallback";
import { useAsyncData } from "../hooks/useAsyncData";
import { priorityLabel, statusLabel } from "../utils/formatters";
import type { TicketStatus } from "../types";
import type { LucideIcon } from "lucide-react";

const statIcons: Record<string, LucideIcon> = {
  total: Ticket,
  ABERTO: PauseCircle,
  EM_ANDAMENTO: TimerReset,
  AGUARDANDO: Clock3,
  RESOLVIDO: CheckCircle2,
  FECHADO: LockKeyhole,
};

const statusColors: Record<TicketStatus, string> = {
  ABERTO: "blue",
  EM_ANDAMENTO: "red",
  AGUARDANDO: "amber",
  RESOLVIDO: "emerald",
  FECHADO: "slate",
};

const statusDots: Record<TicketStatus, string> = {
  ABERTO: "#2563eb",
  EM_ANDAMENTO: "#ef4444",
  AGUARDANDO: "#f59e0b",
  RESOLVIDO: "#14b8a6",
  FECHADO: "#94a3b8",
};

export default function Dashboard() {
  const { data: tickets, loading } = useAsyncData(() => ticketsApi.list(), [], fallbackTickets);
  const activeTickets = tickets.length ? tickets : fallbackTickets;

  const counts = statusOptions.reduce<Record<TicketStatus, number>>((acc, status) => {
    acc[status.value] = activeTickets.filter((ticketItem) => ticketItem.status === status.value).length;
    return acc;
  }, {});

  const priorityCounts = priorityOptions.map((priority) => ({
    ...priority,
    count: activeTickets.filter((ticketItem) => ticketItem.priority === priority.value).length,
  }));

  const stats = [
    { key: "total", label: "Total de Tickets", value: activeTickets.length, color: "blue", trend: "+12% em relacao ao mes anterior" },
    ...statusOptions.map((status) => ({
      key: status.value,
      label: status.label,
      value: counts[status.value],
      color: statusColors[status.value],
      trend: "+5% em relacao ao mes anterior",
    })),
  ];

  const lineValues = [12, 8, 24, 13, 26, 17, 35];
  const maxLine = Math.max(...lineValues);

  return (
    <div>
      <SectionHeader title="Dashboard" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {stats.map((stat) => (
          <StatCard key={stat.key} color={stat.color} icon={statIcons[stat.key]} label={stat.label} trend={stat.trend} value={stat.value} />
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.45fr]">
        <section className="content-card rounded-md p-5">
          <h3 className="mb-4 text-base font-extrabold text-slate-950">Tickets por Status</h3>
          {loading && !activeTickets.length ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <div
                className="h-44 w-44 rounded-full"
                style={{
                  background: `conic-gradient(#2563eb 0 25%, #ef4444 25% 52%, #f59e0b 52% 66%, #14b8a6 66% 88%, #94a3b8 88% 100%)`,
                }}
              >
                <div className="m-auto mt-10 h-24 w-24 rounded-full bg-white" />
              </div>
              <div className="space-y-3">
                {statusOptions.map((status) => (
                  <div key={status.value} className="flex items-center gap-3 text-sm">
                    <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: statusDots[status.value] }} />
                    <span className="min-w-36 text-slate-700">{status.label}</span>
                    <StatusBadge value={status.value} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="content-card rounded-md p-5">
          <h3 className="mb-4 text-base font-extrabold text-slate-950">Tickets criados nos ultimos 7 dias</h3>
          <div className="chart-grid relative h-60 overflow-hidden rounded-md px-5 py-4">
            <svg className="h-full w-full overflow-visible" viewBox="0 0 520 210" preserveAspectRatio="none">
              <polyline
                fill="none"
                points={lineValues
                  .map((value, index) => `${(index / (lineValues.length - 1)) * 500 + 10},${190 - (value / maxLine) * 160}`)
                  .join(" ")}
                stroke="#1d63ed"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
              />
              {lineValues.map((value, index) => (
                <circle key={`${value}-${index}`} cx={(index / (lineValues.length - 1)) * 500 + 10} cy={190 - (value / maxLine) * 160} fill="#1d63ed" r="5" />
              ))}
            </svg>
            <div className="mt-2 grid grid-cols-7 text-center text-xs text-slate-500">
              {["07/05", "08/05", "09/05", "10/05", "11/05", "12/05", "13/05"].map((date) => (
                <span key={date}>{date}</span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="content-card rounded-md p-5">
          <h3 className="mb-4 text-base font-extrabold text-slate-950">Tickets por Prioridade</h3>
          <div className="space-y-5">
            {priorityCounts.map((item) => {
              const width = Math.max(12, (item.count / Math.max(...priorityCounts.map((priority) => priority.count), 1)) * 100);
              const color = item.value === "CRITICA" ? "bg-red-500" : item.value === "ALTA" ? "bg-orange-500" : item.value === "MEDIA" ? "bg-amber-500" : "bg-emerald-500";

              return (
                <div key={item.value} className="grid grid-cols-[96px_1fr_32px] items-center gap-3 text-sm">
                  <span className="font-medium text-slate-700">{priorityLabel(item.value)}</span>
                  <span className="h-2 rounded-full bg-slate-100">
                    <span className={`block h-2 rounded-full ${color}`} style={{ width: `${width}%` }} />
                  </span>
                  <span className="text-right text-slate-700">{item.count}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="content-card rounded-md p-5">
          <h3 className="mb-4 text-base font-extrabold text-slate-950">Tickets por Departamento</h3>
          <div className="space-y-5">
            {[
              ["TI", 65, "bg-blue-600"],
              ["Financeiro", 20, "bg-violet-500"],
              ["RH", 15, "bg-teal-500"],
              ["Outros", 28, "bg-slate-500"],
            ].map(([label, value, color]) => (
              <div key={label} className="grid grid-cols-[96px_1fr_36px] items-center gap-3 text-sm">
                <span className="font-medium text-slate-700">{label}</span>
                <span className="h-2 rounded-full bg-slate-100">
                  <span className={`block h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
                </span>
                <span className="text-right text-slate-700">{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
