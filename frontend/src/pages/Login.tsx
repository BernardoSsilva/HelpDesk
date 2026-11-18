import { Alert, Button, Checkbox, FormControlLabel, IconButton, TextField } from "@mui/material";
import { Eye, EyeOff, Headphones } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { useSettings } from "../state/SettingsContext";
import { getErrorMessage } from "../utils/errors";

export default function Login() {
  const { isAuthenticated, loading, login } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      await login({ email, password, remember });

      const from = location.state?.from;
      navigate(from ? `${from.pathname}${from.search ?? ""}` : "/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível entrar. Confira seu e-mail e senha."));
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#061c32] text-white">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <section className="w-full max-w-[420px]">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-blue-400/60 text-blue-300">
              <Headphones className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-extrabold">{settings.systemName}</h1>
            <p className="mt-2 text-sm text-slate-300">Sistema de Tickets</p>
          </div>

          <form className="content-card rounded-md p-8 text-slate-950" onSubmit={handleSubmit}>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-extrabold">Entrar</h2>
              <p className="mt-2 text-sm text-slate-500">Acesse sua conta para continuar</p>
            </div>

            {error ? (
              <Alert className="mb-4" role="alert" severity="error">
                {error}
              </Alert>
            ) : null}

            <div className="flex flex-col gap-4">
              <TextField
                fullWidth
                required
                autoComplete="email"
                autoFocus
                label="E-mail"
                placeholder="seu@email.com"
                size="small"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <TextField
                fullWidth
                required
                autoComplete="current-password"
                label="Senha"
                placeholder="********"
                size="small"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                slotProps={{
                  input: {
                    endAdornment: (
                      <IconButton
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        edge="end"
                        onClick={() => setShowPassword((current) => !current)}
                        size="small"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </IconButton>
                    ),
                  },
                }}
              />
            </div>

            <div className="my-4 flex items-center justify-between gap-3">
              <FormControlLabel
                control={<Checkbox checked={remember} size="small" onChange={(event) => setRemember(event.target.checked)} />}
                label={<span className="text-sm">Lembrar de mim</span>}
              />
            </div>

            <Button fullWidth disabled={loading} type="submit" variant="contained">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-300">
            Precisa de ajuda? Fale com <a className="underline" href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a>
          </p>
        </section>
      </div>

      <p className="pb-8 text-center text-xs text-slate-300">
        © {new Date().getFullYear()} {settings.systemName}. Todos os direitos reservados.
      </p>
    </main>
  );
}
