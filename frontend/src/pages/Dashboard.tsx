import {
  Alert,
  Button,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { CheckCircle2, Clock3, LockKeyhole, PauseCircle, RefreshCw, Search, SlidersHorizontal, Ticket, TimerReset } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardApi } from "../api/client";
import { PriorityBadge, StatusBadge } from "../components/BadgePill";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";
import SelectField from "../components/SelectField";
import StatCard from "../components/StatCard";
import { priorityOptions, statusOptions } from "../data/constants";
import { useAsyncData } from "../hooks/useAsyncData";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { formatDateTime, priorityLabel, shortId, statusLabel } from "../utils/formatters";
import type { DashboardData, DashboardFilters, TicketPriority, TicketStatus } from "../types";
import type { LucideIcon } from "lucide-react";

const emptyDashboard: DashboardData = {
  filters: {
    endDate: "",
    startDate: "",
  },
  options: {
    requesters: [],
    responsibles: [],
  },
  recentTickets: [],
  series: [],
  stats: {
    changePercent: 0,
    previousTotal: 0,
    total: 0,
  },
  ticketsByPriority: priorityOptions.map((priority) => ({ count: 0, priority: priority.value })),
  ticketsByResponsible: [],
  ticketsByStatus: statusOptions.map((status) => ({ count: 0, status: status.value })),
};

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

function dateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function defaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  return dateInputValue(date);
}

function trendText(value: number) {
  if (value === 0) {
    return "Sem variação contra o período anterior";
  }

  return `${value > 0 ? "+" : ""}${value}% contra o período anterior`;
}

function conicGradient(data: DashboardData["ticketsByStatus"]) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (!total) {
    return "#e2e8f0";
  }

  let current = 0;
  const segments = data.map((item) => {
    const start = current;
    const end = current + (item.count / total) * 100;
    current = end;
    return `${statusDots[item.status]} ${start}% ${end}%`;
  });

  return `conic-gradient(${segments.join(", ")})`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DashboardFilters>({
    endDate: dateInputValue(new Date()),
    priority: "",
    requesterId: "",
    responsibleId: "",
    search: "",
    startDate: defaultStartDate(),
    status: "",
  });

  // A busca só dispara a requisição quando o usuário para de digitar; os demais filtros valem na hora.
  const debouncedSearch = useDebouncedValue(filters.search);

  const { data: dashboard, error, loading, refresh } = useAsyncData(
    () => dashboardApi.get({ ...filters, search: debouncedSearch }),
    [filters.endDate, filters.priority, filters.requesterId, filters.responsibleId, debouncedSearch, filters.startDate, filters.status],
    emptyDashboard,
  );

  const statusCounts = useMemo(() => {
    return Object.fromEntries(dashboard.ticketsByStatus.map((item) => [item.status, item.count])) as Record<TicketStatus, number>;
  }, [dashboard.ticketsByStatus]);

  const stats = [
    {
      key: "total",
      label: "Total de Tickets",
      value: dashboard.stats.total,
      color: "blue",
      trend: trendText(dashboard.stats.changePercent),
    },
    ...statusOptions.map((status) => ({
      key: status.value,
      label: status.label,
      value: statusCounts[status.value] || 0,
      color: statusColors[status.value],
      trend: "No período filtrado",
    })),
  ];

  const maxSeries = Math.max(...dashboard.series.map((item) => item.count), 1);
  const maxPriority = Math.max(...dashboard.ticketsByPriority.map((item) => item.count), 1);
  const maxResponsible = Math.max(...dashboard.ticketsByResponsible.map((item) => item.count), 1);

  const updateFilter = (key: keyof DashboardFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      endDate: dateInputValue(new Date()),
      priority: "",
      requesterId: "",
      responsibleId: "",
      search: "",
      startDate: defaultStartDate(),
      status: "",
    });
  };

  return (
    <div>
      <SectionHeader
        title="Dashboard"
        actions={
          <Button startIcon={<RefreshCw className="h-4 w-4" />} variant="outlined" onClick={() => refresh()}>
            Atualizar
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

      <section className="content-card mb-5 rounded-md p-5">
        <div className="grid gap-3 lg:grid-cols-4 2xl:grid-cols-7">
          <TextField
            label="Início"
            size="small"
            type="date"
            value={filters.startDate}
            onChange={(event) => updateFilter("startDate", event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Fim"
            size="small"
            type="date"
            value={filters.endDate}
            onChange={(event) => updateFilter("endDate", event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Busca"
            placeholder="Título ou descrição"
            size="small"
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
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
          <SelectField
            emptyLabel="Todos"
            label="Status"
            options={statusOptions}
            value={filters.status || ""}
            onChange={(value) => updateFilter("status", value)}
          />
          <SelectField
            emptyLabel="Todas"
            label="Prioridade"
            options={priorityOptions}
            value={filters.priority || ""}
            onChange={(value) => updateFilter("priority", value)}
          />
          <SelectField
            emptyLabel="Todos"
            label="Solicitante"
            options={dashboard.options.requesters.map((user) => ({ value: user.id, label: user.name }))}
            value={filters.requesterId || ""}
            onChange={(value) => updateFilter("requesterId", value)}
          />
          <SelectField
            emptyLabel="Todos"
            label="Responsável"
            options={[{ value: "unassigned", label: "Sem responsável" }, ...dashboard.options.responsibles.map((user) => ({ value: user.id, label: user.name }))]}
            value={filters.responsibleId || ""}
            onChange={(value) => updateFilter("responsibleId", value)}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button startIcon={<SlidersHorizontal className="h-4 w-4" />} variant="outlined" onClick={clearFilters}>
            Limpar filtros
          </Button>
          <span className="text-sm font-medium text-slate-500">
            {loading ? "Carregando..." : `${dashboard.stats.total} tickets encontrados`}
          </span>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {stats.map((stat) => (
          <StatCard key={stat.key} color={stat.color} icon={statIcons[stat.key]} label={stat.label} trend={stat.trend} value={stat.value} />
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.45fr]">
        <section className="content-card rounded-md p-5">
          <h3 className="mb-4 text-base font-extrabold text-slate-950">Tickets por Status</h3>
          {!dashboard.stats.total ? (
            <EmptyState title="Sem dados para os filtros" description="Ajuste os filtros para visualizar os indicadores." />
          ) : (
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <div className="flex h-44 w-44 items-center justify-center rounded-full" style={{ background: conicGradient(dashboard.ticketsByStatus) }}>
                <div className="h-24 w-24 rounded-full bg-white" />
              </div>
              <div className="space-y-3">
                {dashboard.ticketsByStatus.map((item) => (
                  <div key={item.status} className="flex items-center gap-3 text-sm">
                    <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: statusDots[item.status] }} />
                    <span className="min-w-36 text-slate-700">{statusLabel(item.status)}</span>
                    <StatusBadge value={item.status} />
                    <span className="font-bold text-slate-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="content-card rounded-md p-5">
          <h3 className="mb-4 text-base font-extrabold text-slate-950">Tickets criados no período</h3>
          <div className="chart-grid relative h-60 overflow-hidden rounded-md px-5 py-4">
            <svg className="h-full w-full overflow-visible" viewBox="0 0 520 210" preserveAspectRatio="none">
              <polyline
                fill="none"
                points={dashboard.series
                  .map((item, index) => {
                    const x = dashboard.series.length === 1 ? 260 : (index / (dashboard.series.length - 1)) * 500 + 10;
                    return `${x},${190 - (item.count / maxSeries) * 160}`;
                  })
                  .join(" ")}
                stroke="#1d63ed"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
              />
              {dashboard.series.map((item, index) => {
                const x = dashboard.series.length === 1 ? 260 : (index / (dashboard.series.length - 1)) * 500 + 10;
                return <circle key={item.date} cx={x} cy={190 - (item.count / maxSeries) * 160} fill="#1d63ed" r="5" />;
              })}
            </svg>
            <div className="mt-2 grid text-center text-xs text-slate-500" style={{ gridTemplateColumns: `repeat(${Math.max(dashboard.series.length, 1)}, minmax(0, 1fr))` }}>
              {dashboard.series.map((item) => (
                <span key={item.date}>{item.label}</span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="content-card rounded-md p-5">
          <h3 className="mb-4 text-base font-extrabold text-slate-950">Tickets por Prioridade</h3>
          <div className="space-y-5">
            {dashboard.ticketsByPriority.map((item) => {
              const width = Math.max(item.count ? 8 : 0, (item.count / maxPriority) * 100);
              const color = item.priority === "CRITICA" ? "bg-red-500" : item.priority === "ALTA" ? "bg-orange-500" : item.priority === "MEDIA" ? "bg-amber-500" : "bg-emerald-500";

              return (
                <div key={item.priority} className="grid grid-cols-[96px_1fr_32px] items-center gap-3 text-sm">
                  <span className="font-medium text-slate-700">{priorityLabel(item.priority)}</span>
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
          <h3 className="mb-4 text-base font-extrabold text-slate-950">Tickets por Responsável</h3>
          {dashboard.ticketsByResponsible.length ? (
            <div className="space-y-5">
              {dashboard.ticketsByResponsible.map((item) => {
                const width = Math.max(8, (item.count / maxResponsible) * 100);

                return (
                  <div key={item.id || "unassigned"} className="grid grid-cols-[minmax(96px,160px)_1fr_36px] items-center gap-3 text-sm">
                    <span className="truncate font-medium text-slate-700">{item.name}</span>
                    <span className="h-2 rounded-full bg-slate-100">
                      <span className="block h-2 rounded-full bg-blue-600" style={{ width: `${width}%` }} />
                    </span>
                    <span className="text-right text-slate-700">{item.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Nenhum responsável encontrado" description="Os tickets filtrados ainda não possuem responsáveis vinculados." />
          )}
        </section>
      </div>

      <section className="content-card mt-5 rounded-md p-5">
        <h3 className="mb-4 text-base font-extrabold text-slate-950">Tickets recentes</h3>
        {dashboard.recentTickets.length ? (
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
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboard.recentTickets.map((ticketItem) => (
                  <TableRow hover key={ticketItem.id} sx={{ cursor: "pointer" }} onClick={() => navigate(`/tickets/${ticketItem.id}`)}>
                    <TableCell className="font-bold">{shortId(ticketItem.id)}</TableCell>
                    <TableCell>{ticketItem.title}</TableCell>
                    <TableCell>
                      <StatusBadge value={ticketItem.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge value={ticketItem.priority} />
                    </TableCell>
                    <TableCell>{ticketItem.responsible?.name || "-"}</TableCell>
                    <TableCell>{ticketItem.requester?.name || "-"}</TableCell>
                    <TableCell>{formatDateTime(ticketItem.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <EmptyState title="Nenhum ticket encontrado" description="Ajuste os filtros para visualizar tickets recentes." />
        )}
      </section>
    </div>
  );
}
