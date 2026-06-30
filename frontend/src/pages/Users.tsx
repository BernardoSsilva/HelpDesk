import {
  Alert,
  Avatar,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { Pencil, Plus, Search, ShieldCheck, SlidersHorizontal, Trash2, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { usersApi } from "../api/client";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";
import { roleOptions } from "../data/constants";
import { useAsyncData } from "../hooks/useAsyncData";
import { formatDateTime, normalizeText } from "../utils/formatters";
import type { CreateUserPayload, UpdateUserPayload, User, UserRole } from "../types";

type UserForm = CreateUserPayload;

const rowsPerPage = 8;
const emptyUsers: User[] = [];

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
  const { data: users, error, loading, refresh } = useAsyncData<User[]>(() => usersApi.list(), [], emptyUsers);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState("");

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesQuery = normalizeText(`${user.name} ${user.email}`).includes(normalizeText(query));
      const matchesRole = role ? user.role === role : true;

      return matchesQuery && matchesRole;
    });
  }, [query, role, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const pageUsers = filteredUsers.slice((page - 1) * rowsPerPage, page * rowsPerPage);

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
    if (!form.userName.trim()) return "Informe o nome do usuario.";
    if (!form.userEmail.trim()) return "Informe o e-mail do usuario.";
    if (!/^\S+@\S+\.\S+$/.test(form.userEmail.trim())) return "Informe um e-mail valido.";
    if (!editingUser && !form.password.trim()) return "Informe a senha inicial.";
    if (form.password && form.password.length < 6) return "A senha deve ter pelo menos 6 caracteres.";

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
      const message = err instanceof Error ? err.message : "Nao foi possivel salvar o usuario.";
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (user: User) => {
    const shouldRemove = window.confirm(`Excluir ${user.name}? Esta acao nao pode ser desfeita.`);

    if (!shouldRemove) {
      return;
    }

    setRemovingId(user.id);

    try {
      await usersApi.remove(user.id);
      await refresh();
    } finally {
      setRemovingId("");
    }
  };

  return (
    <div>
      <SectionHeader
        title="Usuarios"
        actions={
          <Button startIcon={<Plus className="h-4 w-4" />} variant="contained" onClick={openCreate}>
            Novo Usuario
          </Button>
        }
      />

      {error ? (
        <Alert className="mb-5" severity="info">
          {error}
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
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search className="h-4 w-4" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Perfil</InputLabel>
            <Select
              label="Perfil"
              value={role}
              onChange={(event: SelectChangeEvent) => {
                setRole(event.target.value as UserRole | "");
                setPage(1);
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              {roleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button startIcon={<SlidersHorizontal className="h-4 w-4" />} variant="outlined" onClick={clearFilters}>
            Limpar filtros
          </Button>

          <span className="text-sm font-medium text-slate-500">
            {loading ? "Carregando usuarios reais..." : `${filteredUsers.length} usuarios encontrados`}
          </span>
        </div>

        {loading && !users.length ? (
          <div className="flex items-center justify-center gap-3 py-12 text-sm font-semibold text-slate-500">
            <CircularProgress size={22} />
            Carregando usuarios...
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
                    <TableCell align="right">Acoes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageUsers.map((user) => (
                    <TableRow hover key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar sx={{ width: 28, height: 28 }}>{user.name?.charAt(0).toUpperCase() || "U"}</Avatar>
                          <span className="font-semibold">{user.name}</span>
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
                          <IconButton onClick={() => openEdit(user)} size="small">
                            <Pencil className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <span>
                            <IconButton color="error" disabled={removingId === user.id} onClick={() => removeUser(user)} size="small">
                              <Trash2 className="h-4 w-4" />
                            </IconButton>
                          </span>
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
          <EmptyState title="Nenhum usuario encontrado" description="Ajuste os filtros ou crie um novo usuario para continuar." />
        )}
      </section>

      <Dialog fullWidth maxWidth="sm" open={dialogOpen} onClose={() => (saving ? null : setDialogOpen(false))}>
        <DialogTitle>{editingUser ? "Editar Usuario" : "Novo Usuario"}</DialogTitle>
        <DialogContent className="space-y-4 pt-3">
          {formError ? <Alert severity="error">{formError}</Alert> : null}
          <TextField
            fullWidth
            label="Nome"
            size="small"
            value={form.userName}
            onChange={(event) => setForm((current) => ({ ...current, userName: event.target.value }))}
          />
          <TextField
            fullWidth
            label="E-mail"
            size="small"
            type="email"
            value={form.userEmail}
            onChange={(event) => setForm((current) => ({ ...current, userEmail: event.target.value }))}
          />
          <TextField
            fullWidth
            helperText={editingUser ? "Deixe em branco para manter a senha atual." : ""}
            label={editingUser ? "Nova senha" : "Senha"}
            size="small"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Perfil</InputLabel>
            <Select label="Perfil" value={form.userRole} onChange={(event: SelectChangeEvent) => setForm((current) => ({ ...current, userRole: event.target.value as UserRole }))}>
              {roleOptions.map((roleOption) => (
                <MenuItem key={roleOption.value} value={roleOption.value}>
                  {roleOption.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
    </div>
  );
}
