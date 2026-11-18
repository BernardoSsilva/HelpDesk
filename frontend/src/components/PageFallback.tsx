import { CircularProgress } from "@mui/material";

/** Indicador exibido enquanto o arquivo de uma página é carregado. */
export default function PageFallback() {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm font-semibold text-slate-500" role="status">
      <CircularProgress size={22} />
      Carregando...
    </div>
  );
}
