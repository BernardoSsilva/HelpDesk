import { Button, FormControlLabel, Switch, TextField } from "@mui/material";
import { Save } from "lucide-react";
import SectionHeader from "../components/SectionHeader";

export default function Settings() {
  return (
    <div>
      <SectionHeader title="Configuracoes" />
      <section className="content-card max-w-3xl rounded-md p-5">
        <div className="grid gap-5">
          <TextField defaultValue="Help Desk" label="Nome do sistema" size="small" />
          <TextField defaultValue="suporte@empresa.com" label="E-mail de suporte" size="small" />
          <FormControlLabel control={<Switch defaultChecked />} label="Enviar notificacoes por e-mail" />
          <FormControlLabel control={<Switch defaultChecked />} label="Permitir comentarios em tickets fechados" />
          <div className="flex justify-end">
            <Button startIcon={<Save className="h-4 w-4" />} variant="contained">
              Salvar
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
