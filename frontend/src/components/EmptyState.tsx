import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title?: string;
  description?: string;
};

export default function EmptyState({ title = "Nada encontrado", description = "Os dados aparecerao aqui quando estiverem disponiveis." }: EmptyStateProps) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
      <Inbox className="h-9 w-9 text-slate-400" />
      <p className="mt-3 text-sm font-extrabold text-slate-900">{title}</p>
      <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}
