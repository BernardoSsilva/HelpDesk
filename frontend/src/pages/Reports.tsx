import { BarChart3 } from "lucide-react";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";

export default function Reports() {
  return (
    <div>
      <SectionHeader title="Relatórios" />
      <section className="content-card rounded-md p-5">
        <EmptyState
          title="Relatórios em preparação"
          description="A estrutura da tela já está pronta para receber gráficos e exportações quando os endpoints de relatório forem adicionados."
        />
        <div className="mt-5 flex justify-center text-blue-600">
          <BarChart3 className="h-10 w-10" />
        </div>
      </section>
    </div>
  );
}
