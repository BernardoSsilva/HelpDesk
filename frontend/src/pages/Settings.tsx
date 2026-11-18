import { Alert, Button, FormControlLabel, Switch, TextField } from "@mui/material";
import { KeyRound, Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { usersApi } from "../api/client";
import SectionHeader from "../components/SectionHeader";
import { roleOptions } from "../data/constants";
import { useAuth } from "../state/AuthContext";
import { useSettings, type AppSettings } from "../state/SettingsContext";
import { getErrorMessage } from "../utils/errors";
import { formatDateTime, labelFrom } from "../utils/formatters";

const PASSWORD_MIN = 8;
const PASSWORD_MAX_BYTES = 72;

function AccountSection() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < PASSWORD_MIN) {
      setError(`A nova senha deve ter pelo menos ${PASSWORD_MIN} caracteres.`);
      return;
    }

    if (new TextEncoder().encode(newPassword).length > PASSWORD_MAX_BYTES) {
      setError(`A nova senha deve ter no máximo ${PASSWORD_MAX_BYTES} bytes.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("A confirmação não confere com a nova senha.");
      return;
    }

    setSaving(true);

    try {
      await usersApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível alterar a senha."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="content-card max-w-3xl rounded-md p-5">
      <h3 className="text-base font-extrabold text-slate-950">Minha conta</h3>

      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-bold text-slate-500">Nome</dt>
          <dd className="mt-1 text-slate-900">{user?.name || "-"}</dd>
        </div>
        <div>
          <dt className="font-bold text-slate-500">E-mail</dt>
          <dd className="mt-1 break-all text-slate-900">{user?.email || "-"}</dd>
        </div>
        <div>
          <dt className="font-bold text-slate-500">Perfil</dt>
          <dd className="mt-1 text-slate-900">{labelFrom(roleOptions, user?.role)}</dd>
        </div>
        <div>
          <dt className="font-bold text-slate-500">Conta criada em</dt>
          <dd className="mt-1 text-slate-900">{formatDateTime(user?.createdAt)}</dd>
        </div>
      </dl>

      <form className="mt-6 grid gap-4 border-t border-slate-200 pt-5" onSubmit={handleSubmit}>
        <h4 className="text-sm font-extrabold text-slate-950">Alterar senha</h4>

        {success ? (
          <Alert severity="success" onClose={() => setSuccess(false)}>
            Senha alterada com sucesso.
          </Alert>
        ) : null}
        {error ? (
          <Alert role="alert" severity="error">
            {error}
          </Alert>
        ) : null}

        <TextField
          required
          autoComplete="current-password"
          label="Senha atual"
          size="small"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
        <TextField
          required
          autoComplete="new-password"
          helperText={`Mínimo de ${PASSWORD_MIN} caracteres.`}
          label="Nova senha"
          size="small"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        <TextField
          required
          autoComplete="new-password"
          label="Confirmar nova senha"
          size="small"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
        <div className="flex justify-end">
          <Button disabled={saving} startIcon={<KeyRound className="h-4 w-4" />} type="submit" variant="contained">
            {saving ? "Salvando..." : "Alterar senha"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function PreferencesSection() {
  const { settings, saveSettings } = useSettings();
  const [form, setForm] = useState<AppSettings>(settings);
  const [showSuccess, setShowSuccess] = useState(false);

  const isDirty = JSON.stringify(form) !== JSON.stringify(settings);

  useEffect(() => {
    if (!showSuccess) {
      return;
    }

    const timeout = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timeout);
  }, [showSuccess]);

  const updateField = <K extends keyof AppSettings>(field: K, value: AppSettings[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = () => {
    saveSettings({ ...form, systemName: form.systemName.trim() || settings.systemName });
    setShowSuccess(true);
  };

  return (
    <section className="content-card max-w-3xl rounded-md p-5">
      <h3 className="text-base font-extrabold text-slate-950">Preferências</h3>
      <p className="mt-1 text-sm text-slate-500">Ficam salvas apenas neste navegador.</p>

      {showSuccess ? (
        <Alert className="mt-4" severity="success">
          Configurações salvas com sucesso.
        </Alert>
      ) : null}

      <div className="mt-5 grid gap-5">
        <TextField
          label="Nome do sistema"
          size="small"
          value={form.systemName}
          onChange={(event) => updateField("systemName", event.target.value)}
          slotProps={{ htmlInput: { maxLength: 40 } }}
        />
        <TextField
          label="E-mail de suporte"
          size="small"
          type="email"
          value={form.supportEmail}
          onChange={(event) => updateField("supportEmail", event.target.value)}
        />
        <div>
          <FormControlLabel
            control={<Switch checked={form.allowClosedComments} onChange={(event) => updateField("allowClosedComments", event.target.checked)} />}
            label="Permitir comentários em tickets fechados"
          />
        </div>
        <div>
          <FormControlLabel
            control={<Switch checked={form.emailNotifications} disabled onChange={(event) => updateField("emailNotifications", event.target.checked)} />}
            label="Enviar notificações por e-mail"
          />
          <p className="ml-1 text-xs text-slate-500">Disponível quando o envio de e-mails for implementado.</p>
        </div>
        <div className="flex justify-end">
          <Button disabled={!isDirty} startIcon={<Save className="h-4 w-4" />} variant="contained" onClick={handleSave}>
            Salvar
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Settings() {
  return (
    <div>
      <SectionHeader title="Configurações" />
      <div className="grid gap-5">
        <AccountSection />
        <PreferencesSection />
      </div>
    </div>
  );
}
