import {
  Alert,
  Avatar,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
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
import { Pencil, Plus, Search, ShieldCheck, SlidersHorizontal, Trash2, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { usersApi } from "../api/client";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";
import SelectField from "../components/SelectField";
import { roleOptions } from "../data/constants";
import { useAsyncData } from "../hooks/useAsyncData";
import { useAuth } from "../state/AuthContext";
import type { CreateUserPayload, UpdateUserPayload, User, UserRole } from "../types";
import { getErrorMessage } from "../utils/errors";
import { formatDateTime, normalizeText } from "../utils/formatters";

type UserForm = CreateUserPayload;

const rowsPerPage = 8;
const emptyUsers: User[] = [];
const PASSWORD_MIN = 8;
const PASSWORD_MAX_BYTES = 72;

const emptyForm: UserForm = {
  userName: "",
  userEmail: "",
  password: "",
  userRole: "USER",
};

const roleClasses: Record<UserRole, string> = {
  ADMIN: "bg-blue-50 text-blue-700 ring-blue-200",
  USER: "bg-slate-100 text-slate-700 ring-slate-200",
};

function RoleBadge({ value }: { value: UserRole }) {
  const Icon = value === "ADMIN" ? ShieldCheck : UserRound;
  const label = roleOptions.find((role) => role.value === value)?.label || value;

  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-extrabold ring-1 ${roleClasses[value]}`}>
      <Icon className="h-3.5 w-3.5" />
      {label.toUpperCase()}
    </span>
  );
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const { data: users, error, loading, refresh } = useAsyncData<User[]>(() => usersApi.list(), [], emptyUsers);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [userToRemove, setUserToRemove] = useState<User | null>(null);
  const [removing, setRemoving] = useState(false);
  const [actionError, setActionError] = useState("");

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesQuery = normalizeText(`${user.name} ${user.email}`).includes(normalizeText(query));
      const matchesRole = role ? user.role === role : true;

      return matchesQuery && matchesRole;
    });
  }, [query, role, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageUsers = filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      userName: user.name,
      userEmail: user.email,
      password: "",
      userRole: user.role,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const clearFilters = () => {
    setQuery("");
    setRole("");
    setPage(1);
  };

  const validateForm = () => {
    if (form.userName.trim().length < 2) return "Informe o nome do usuário (mínimo de 2 caracteres).";
    if (!form.userEmail.trim()) return "Informe o e-mail do usuário.";
    if (!/^\S+@\S+\.\S+$/.test(form.userEmail.trim())) return "Informe um e-mail válido.";
    if (!editingUser && !form.password) return "Informe a senha inicial.";
    if (form.password && form.password.length < PASSWORD_MIN) return `A senha deve ter pelo menos ${PASSWORD_MIN} caracteres.`;
    if (new TextEncoder().encode(form.password).length > PASSWORD_MAX_BYTES) return `A senha deve ter no máximo ${PASSWORD_MAX_BYTES} bytes.`;

    return "";
  };

  const saveUser = async () => {
    const validationMessage = validateForm();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (editingUser) {
        const payload: UpdateUserPayload = {
          userName: form.userName.trim(),
          userEmail: form.userEmail.trim(),
          userRole: form.userRole,
        };

        if (form.password) {
          payload.password = form.password;
        }

        await usersApi.update(editingUser.id, payload);
      } else {
        await usersApi.create({
          ...form,
          userEmail: form.userEmail.trim(),
          userName: form.userName.trim(),
        });
      }

      setDialogOpen(false);
      await refresh();
    } catch (err) {
      setFormError(getErrorMessage(err, "Não foi possível salvar o usuário."));
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (!userToRemove) {
      return;
    }

    setRemoving(true);
    setActionError("");

    try {
      await usersApi.remove(userToRemove.id);
      setUserToRemove(null);
      await refresh();
    } catch (err) {
      setUserToRemove(null);
      setActionError(getErrorMessage(err, "Não foi possível excluir o usuário."));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Usuários"
        actions={
          <Button startIcon={<Plus className="h-4 w-4" />} variant="contained" onClick={openCreate}>
            Novo Usuário
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
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <TextField
            className="lg:w-80"
            placeholder="Buscar por nome ou e-mail..."
            size="small"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            slotProps={{
              htmlInput: { "aria-label": "Buscar usuários" },
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
            label="Perfil"
            minWidth={180}
            options={roleOptions}
            value={role}
            onChange={(value) => {
              setRole(value as UserRole | "");
              setPage(1);
            }}
          />

          <Button startIcon={<SlidersHorizontal className="h-4 w-4" />} variant="outlined" onClick={clearFilters}>
            Limpar filtros
          </Button>

          <span className="text-sm font-medium text-slate-500">{loading ? "Carregando..." : `${filteredUsers.length} usuários encontrados`}</span>
        </div>

        {loading && !users.length ? (
          <div className="flex items-center justify-center gap-3 py-12 text-sm font-semibold text-slate-500" role="status">
            <CircularProgress size={22} />
            Carregando usuários...
          </div>
        ) : pageUsers.length ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>E-mail</TableCell>
                    <TableCell>Perfil</TableCell>
                    <TableCell>Criado em</TableCell>
                    <TableCell>Atualizado em</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageUsers.map((user) => {
                    const isSelf = user.id === currentUser?.id;

                    return (
                      <TableRow hover key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar sx={{ width: 28, height: 28 }}>{user.name?.charAt(0).toUpperCase() || "U"}</Avatar>
                            <span className="font-semibold">{user.name}</span>
                            {isSelf ? <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-bold text-blue-700">você</span> : null}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <RoleBadge value={user.role} />
                        </TableCell>
                        <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                        <TableCell>{formatDateTime(user.updatedAt)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Editar">
                            <IconButton aria-label={`Editar ${user.name}`} onClick={() => openEdit(user)} size="small">
                              <Pencil className="h-4 w-4" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={isSelf ? "Você não pode excluir a própria conta" : "Excluir"}>
                            <span>
                              <IconButton aria-label={`Excluir ${user.name}`} color="error" disabled={isSelf} onClick={() => setUserToRemove(user)} size="small">
                                <Trash2 className="h-4 w-4" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <div className="mt-5 flex justify-center">
              <Pagination color="primary" count={totalPages} page={currentPage} onChange={(_, value) => setPage(value)} />
            </div>
          </>
        ) : error ? null : (
          <EmptyState title="Nenhum usuário encontrado" description="Ajuste os filtros ou crie um novo usuário para continuar." />
        )}
      </section>

      <Dialog fullWidth maxWidth="sm" open={dialogOpen} onClose={() => (saving ? null : setDialogOpen(false))}>
        <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
          {formError ? <Alert severity="error">{formError}</Alert> : null}
          <TextField
            fullWidth
            required
            label="Nome"
            size="small"
            value={form.userName}
            onChange={(event) => setForm((current) => ({ ...current, userName: event.target.value }))}
            slotProps={{ htmlInput: { maxLength: 100 } }}
          />
          <TextField
            fullWidth
            required
            autoComplete="off"
            label="E-mail"
            size="small"
            type="email"
            value={form.userEmail}
            onChange={(event) => setForm((current) => ({ ...current, userEmail: event.target.value }))}
          />
          <TextField
            fullWidth
            required={!editingUser}
            autoComplete="new-password"
            helperText={editingUser ? "Deixe em branco para manter a senha atual." : `Mínimo de ${PASSWORD_MIN} caracteres.`}
            label={editingUser ? "Nova senha" : "Senha"}
            size="small"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
          <SelectField
            fullWidth
            label="Perfil"
            options={roleOptions}
            value={form.userRole}
            onChange={(value) => setForm((current) => ({ ...current, userRole: value as UserRole }))}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button disabled={saving} variant="contained" onClick={saveUser}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        confirmLabel="Excluir"
        description={`Excluir ${userToRemove?.name ?? "este usuário"}? Esta ação não pode ser desfeita. Usuários com tickets ou atividades registradas não podem ser excluídos.`}
        destructive
        loading={removing}
        open={Boolean(userToRemove)}
        title="Excluir usuário"
        onCancel={() => setUserToRemove(null)}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
