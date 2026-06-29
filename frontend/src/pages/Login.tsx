import { Alert, Button, Checkbox, FormControlLabel, IconButton, TextField } from "@mui/material";
import type { AxiosError } from "axios";
import { Eye, EyeOff, Headphones } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

export default function Login() {
  const { isAuthenticated, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      await login({ email, password });
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      console.log(err)
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || "Nao foi possivel entrar. Confira seu e-mail e senha.");
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
            <h1 className="text-3xl font-extrabold">Help Desk</h1>
            <p className="mt-2 text-sm text-slate-300">Sistema de Tickets</p>
          </div>

          <form className="content-card rounded-md p-8 text-slate-950" onSubmit={handleSubmit}>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-extrabold">Entrar</h2>
              <p className="mt-2 text-sm text-slate-500">Acesse sua conta para continuar</p>
            </div>

            {error ? (
              <Alert className="mb-4" severity="error">
                {error}
              </Alert>
            ) : null}

            <div className="space-y-4">
              <TextField
                fullWidth
                label="E-mail"
                placeholder="seu@email.com"
                size="small"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <TextField
                fullWidth
                label="Senha"
                placeholder="********"
                size="small"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                slotProps={{
                  input: {
                    endAdornment: (
                      <IconButton edge="end" onClick={() => setShowPassword((current) => !current)} size="small">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </IconButton>
                    ),
                  },
                }}
              />
            </div>

            <div className="my-4 flex items-center justify-between gap-3">
              <FormControlLabel control={<Checkbox size="small" />} label={<span className="text-sm">Lembrar de mim</span>} />
              {/* <Link className="text-sm font-bold text-blue-600" to="/login">
                Esqueci minha senha
              </Link> */}
            </div>

            <Button fullWidth disabled={loading} type="submit" variant="contained">
              Entrar
            </Button>
          </form>
        </section>
      </div>

      <p className="pb-8 text-center text-xs text-slate-300">2026 Help Desk. Todos os direitos reservados.</p>
    </main>
  );
}
