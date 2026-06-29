import { Alert, Button, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import type { AxiosError } from "axios";
import { ArrowLeft, Paperclip, Plus } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ticketsApi, usersApi } from "../api/client";
import SectionHeader from "../components/SectionHeader";
import { departmentOptions, priorityOptions } from "../data/constants";
import { fallbackUsers } from "../data/fallback";
import { useAsyncData } from "../hooks/useAsyncData";
import { useAuth } from "../state/AuthContext";
import { priorityLabel } from "../utils/formatters";
import type { TicketPriority } from "../types";

type NewTicketForm = {
  title: string;
  description: string;
  department: string;
  priority: TicketPriority | "";
  responsibleId: string;
};

export default function NewTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: users } = useAsyncData(() => usersApi.list(), [], fallbackUsers);
  const [form, setForm] = useState<NewTicketForm>({
    title: "",
    description: "",
    department: "",
    priority: "",
    responsibleId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedResponsible = useMemo(() => users.find((item) => item.id === form.responsibleId), [form.responsibleId, users]);

  const updateForm = <K extends keyof NewTicketForm>(field: K, value: NewTicketForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!form.priority) {
      setError("Selecione uma prioridade para criar o ticket.");
      return;
    }

    setLoading(true);

    try {
      const createdTicket = await ticketsApi.create({
        title: form.title,
        description: form.description,
        priority: form.priority,
        requesterId: user?.id,
        responsibleId: form.responsibleId || null,
      });
      navigate(`/tickets/${createdTicket.id}`);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || "Nao foi possivel criar o ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Novo Ticket"
        actions={
          <Button startIcon={<ArrowLeft className="h-4 w-4" />} variant="outlined" onClick={() => navigate("/tickets")}>
            Voltar
          </Button>
        }
      />

      <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1fr_300px]">
        <form className="content-card rounded-md p-5" onSubmit={handleSubmit}>
          {error ? (
            <Alert className="mb-4" severity="error">
              {error}
            </Alert>
          ) : null}

          <div className="space-y-5">
            <TextField
              fullWidth
              required
              label="Titulo"
              placeholder="Digite um titulo para o ticket"
              size="small"
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
            />
            <TextField
              fullWidth
              required
              label="Descricao"
              minRows={5}
              multiline
              placeholder="Descreva o problema ou solicitacao com o maximo de detalhes possivel..."
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormControl required size="small">
                <InputLabel>Departamento</InputLabel>
                <Select label="Departamento" value={form.department} onChange={(event: SelectChangeEvent) => updateForm("department", event.target.value)}>
                  {departmentOptions.map((department) => (
                    <MenuItem key={department} value={department}>
                      {department}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl required size="small">
                <InputLabel>Prioridade</InputLabel>
                <Select label="Prioridade" value={form.priority} onChange={(event: SelectChangeEvent) => updateForm("priority", event.target.value as TicketPriority)}>
                  {priorityOptions.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small">
                <InputLabel>Responsavel</InputLabel>
                <Select label="Responsavel" value={form.responsibleId} onChange={(event: SelectChangeEvent) => updateForm("responsibleId", event.target.value)}>
                  <MenuItem value="">Sem responsavel</MenuItem>
                  {users.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">Anexo (opcional)</label>
              <button className="flex w-full items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500" type="button">
                <Paperclip className="h-4 w-4" />
                Selecionar arquivo
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button disabled={loading} startIcon={<Plus className="h-4 w-4" />} type="submit" variant="contained">
              Criar Ticket
            </Button>
          </div>
        </form>

        <aside className="soft-card rounded-md p-5">
          <h2 className="text-base font-extrabold text-slate-950">Resumo</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="font-bold text-slate-500">Departamento</dt>
              <dd className="mt-1 text-slate-900">{form.department || "-"}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-500">Prioridade</dt>
              <dd className="mt-1 text-slate-900">{form.priority ? priorityLabel(form.priority) : "-"}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-500">Responsavel</dt>
              <dd className="mt-1 text-slate-900">{selectedResponsible?.name || "-"}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
