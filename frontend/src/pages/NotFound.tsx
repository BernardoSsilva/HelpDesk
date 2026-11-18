import { Button } from "@mui/material";
import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-10">
      <EmptyState title="Página não encontrada" description="O endereço acessado não existe ou foi movido." />
      <div className="mt-5 flex justify-center">
        <Button component={Link} to="/dashboard" variant="contained">
          Ir para o Dashboard
        </Button>
      </div>
    </div>
  );
}
