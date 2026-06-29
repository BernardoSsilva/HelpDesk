import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
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
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { usersApi } from "../api/client";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";
import { fallbackUsers } from "../data/fallback";
import { roleOptions } from "../data/constants";
import { useAsyncData } from "../hooks/useAsyncData";
import { normalizeText } from "../utils/formatters";
import type { CreateUserPayload, UpdateUserPayload, User, UserRole } from "../types";

type UserForm = CreateUserPayload;

const emptyForm: UserForm = {
  userName: "",
  userEmail: "",
  password: "",
  userRole: "USER",
};

export default function Users() {
  const { data: users, refresh } = useAsyncData(() => usersApi.list(), [], fallbackUsers);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);

  const filteredUsers = useMemo(
    () => users.filter((user) => normalizeText(`${user.name} ${user.email} ${user.role}`).includes(normalizeText(query))),
    [query, users],
  );

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
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
    setDialogOpen(true);
  };

  const saveUser = async () => {
    if (editingUser) {
      const payload: UpdateUserPayload = {
        userName: form.userName,
        userEmail: form.userEmail,
        userRole: form.userRole,
      };

      if (form.password) {
        payload.password = form.password;
      }

      await usersApi.update(editingUser.id, payload);
    } else {
      await usersApi.create(form);
    }

    setDialogOpen(false);
    refresh();
  };

  const removeUser = async (id: string) => {
    await usersApi.remove(id);
    refresh();
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

      <section className="content-card rounded-md p-5">
        <TextField
          className="mb-5 w-full sm:w-80"
          placeholder="Buscar usuarios..."
          size="small"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
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

        {filteredUsers.length ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>E-mail</TableCell>
                  <TableCell>Perfil</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Acoes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow hover key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar sx={{ width: 28, height: 28 }}>{user.name?.charAt(0) || "U"}</Avatar>
                        <span className="font-semibold">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className="rounded bg-blue-50 px-2 py-1 text-xs font-extrabold text-blue-700 ring-1 ring-blue-200">{user.role}</span>
                    </TableCell>
                    <TableCell>
                      <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-200">Ativo</span>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton onClick={() => openEdit(user)} size="small">
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton color="error" onClick={() => removeUser(user.id)} size="small">
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <EmptyState title="Nenhum usuario encontrado" description="Crie novos usuarios para distribuir os chamados." />
        )}
      </section>

      <Dialog fullWidth maxWidth="sm" open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{editingUser ? "Editar Usuario" : "Novo Usuario"}</DialogTitle>
        <DialogContent className="space-y-4 pt-3">
          <TextField fullWidth label="Nome" size="small" value={form.userName} onChange={(event) => setForm((current) => ({ ...current, userName: event.target.value }))} />
          <TextField fullWidth label="E-mail" size="small" value={form.userEmail} onChange={(event) => setForm((current) => ({ ...current, userEmail: event.target.value }))} />
          <TextField
            fullWidth
            label={editingUser ? "Nova senha" : "Senha"}
            size="small"
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Perfil</InputLabel>
            <Select label="Perfil" value={form.userRole} onChange={(event: SelectChangeEvent) => setForm((current) => ({ ...current, userRole: event.target.value as UserRole }))}>
              {roleOptions.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveUser}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
