import { Alert, Button, FormControlLabel, Switch, TextField } from "@mui/material";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import SectionHeader from "../components/SectionHeader";

type SettingsForm = {
  systemName: string;
  supportEmail: string;
  emailNotifications: boolean;
  allowClosedComments: boolean;
};

const storageKey = "helpdesk_settings";

const defaultSettings: SettingsForm = {
  systemName: "Help Desk",
  supportEmail: "suporte@empresa.com",
  emailNotifications: true,
  allowClosedComments: true,
};

function readStoredSettings(): SettingsForm {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export default function Settings() {
  const [saved, setSaved] = useState<SettingsForm>(readStoredSettings);
  const [form, setForm] = useState<SettingsForm>(saved);
  const [showSuccess, setShowSuccess] = useState(false);

  const isDirty = JSON.stringify(form) !== JSON.stringify(saved);

  useEffect(() => {
    if (!showSuccess) {
      return;
    }

    const timeout = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timeout);
  }, [showSuccess]);

  const updateField = <K extends keyof SettingsForm>(field: K, value: SettingsForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = () => {
    localStorage.setItem(storageKey, JSON.stringify(form));
    setSaved(form);
    setShowSuccess(true);
  };

  return (
    <div>
      <SectionHeader title="Configuracoes" />
      <section className="content-card max-w-3xl rounded-md p-5">
        {showSuccess ? (
          <Alert className="mb-5" severity="success">
            Configuracoes salvas com sucesso.
          </Alert>
        ) : null}
        <div className="grid gap-5">
          <TextField
            label="Nome do sistema"
            size="small"
            value={form.systemName}
            onChange={(event) => updateField("systemName", event.target.value)}
          />
          <TextField
            label="E-mail de suporte"
            size="small"
            type="email"
            value={form.supportEmail}
            onChange={(event) => updateField("supportEmail", event.target.value)}
          />
          <FormControlLabel
            control={<Switch checked={form.emailNotifications} onChange={(event) => updateField("emailNotifications", event.target.checked)} />}
            label="Enviar notificacoes por e-mail"
          />
          <FormControlLabel
            control={<Switch checked={form.allowClosedComments} onChange={(event) => updateField("allowClosedComments", event.target.checked)} />}
            label="Permitir comentarios em tickets fechados"
          />
          <div className="flex justify-end">
            <Button disabled={!isDirty} startIcon={<Save className="h-4 w-4" />} variant="contained" onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
