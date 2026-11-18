import { Alert, Button, TextField } from "@mui/material";
import { ArrowLeft, Plus } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ticketsApi, usersApi } from "../api/client";
import SectionHeader from "../components/SectionHeader";
import SelectField from "../components/SelectField";
import { departmentOptions, priorityOptions } from "../data/constants";
import { useAsyncData } from "../hooks/useAsyncData";
import type { DirectoryUser, TicketDepartment, TicketPriority } from "../types";
import { getErrorMessage } from "../utils/errors";
import { departmentLabel, priorityLabel } from "../utils/formatters";

type NewTicketForm = {
  title: string;
  description: string;
  department: TicketDepartment | "";
  priority: TicketPriority | "";
  responsibleId: string;
};

const TITLE_MAX = 150;
const DESCRIPTION_MAX = 5000;
const noUsers: DirectoryUser[] = [];

export default function NewTicket() {
  const navigate = useNavigate();
  const { data: users, error: usersError } = useAsyncData(() => usersApi.directory(), [], noUsers);
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

    const title = form.title.trim();
    const description = form.description.trim();

    if (title.length < 3) {
      setError("O título deve ter pelo menos 3 caracteres.");
      return;
    }

    if (!description) {
      setError("Descreva o problema ou a solicitação.");
      return;
    }

    if (!form.priority || !form.department) {
      setError("Selecione o departamento e a prioridade para criar o ticket.");
      return;
    }

    setLoading(true);

    try {
      // O solicitante é sempre o usuário autenticado: a API define isso, não o formulário.
      const createdTicket = await ticketsApi.create({
        title,
        description,
        priority: form.priority,
        department: form.department,
        responsibleId: form.responsibleId || null,
      });
      navigate(`/tickets/${createdTicket.id}`);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível criar o ticket."));
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
            <Alert className="mb-4" role="alert" severity="error">
              {error}
            </Alert>
          ) : null}

          {usersError ? (
            <Alert className="mb-4" severity="warning">
              Não foi possível carregar a lista de responsáveis. Você ainda pode criar o ticket sem responsável.
            </Alert>
          ) : null}

          <div className="flex flex-col gap-5">
            <TextField
              fullWidth
              required
              helperText={`${form.title.length}/${TITLE_MAX}`}
              label="Título"
              placeholder="Digite um título para o ticket"
              size="small"
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
              slotProps={{ htmlInput: { maxLength: TITLE_MAX } }}
            />
            <TextField
              fullWidth
              required
              helperText={`${form.description.length}/${DESCRIPTION_MAX}`}
              label="Descrição"
              minRows={5}
              multiline
              placeholder="Descreva o problema ou solicitação com o máximo de detalhes possível..."
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              slotProps={{ htmlInput: { maxLength: DESCRIPTION_MAX } }}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <SelectField
                required
                label="Departamento"
                options={departmentOptions}
                value={form.department}
                onChange={(value) => updateForm("department", value as TicketDepartment)}
              />
              <SelectField
                required
                label="Prioridade"
                options={priorityOptions}
                value={form.priority}
                onChange={(value) => updateForm("priority", value as TicketPriority)}
              />
              <SelectField
                emptyLabel="Sem responsável"
                label="Responsável"
                options={users.map((item) => ({ value: item.id, label: item.name }))}
                value={form.responsibleId}
                onChange={(value) => updateForm("responsibleId", value)}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button disabled={loading} startIcon={<Plus className="h-4 w-4" />} type="submit" variant="contained">
              {loading ? "Criando..." : "Criar Ticket"}
            </Button>
          </div>
        </form>

        <aside className="soft-card rounded-md p-5">
          <h2 className="text-base font-extrabold text-slate-950">Resumo</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="font-bold text-slate-500">Departamento</dt>
              <dd className="mt-1 text-slate-900">{departmentLabel(form.department)}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-500">Prioridade</dt>
              <dd className="mt-1 text-slate-900">{form.priority ? priorityLabel(form.priority) : "-"}</dd>
            </div>
            <div>
              <dt className="font-bold text-slate-500">Responsável</dt>
              <dd className="mt-1 text-slate-900">{selectedResponsible?.name || "-"}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
