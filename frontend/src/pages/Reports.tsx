import { BarChart3 } from "lucide-react";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";

export default function Reports() {
  return (
    <div>
      <SectionHeader title="Relatorios" />
      <section className="content-card rounded-md p-5">
        <EmptyState
          title="Relatorios em preparacao"
          description="A estrutura da tela ja esta pronta para receber graficos e exportacoes quando os endpoints de relatorio forem adicionados."
        />
        <div className="mt-5 flex justify-center text-blue-600">
          <BarChart3 className="h-10 w-10" />
        </div>
      </section>
    </div>
  );
}
