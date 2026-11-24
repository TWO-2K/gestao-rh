import Link from "next/link";
import { getUnidades } from "@/lib/data/lookups";
import { ImportarVagas } from "@/components/vagas/importar-vagas";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function ImportarVagasPage() {
  const unidades = await getUnidades();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Importar vagas</h1>
          <p className="text-sm text-muted-foreground">
            Carregue uma planilha para migrar o histórico de vagas de uma unidade.
          </p>
        </div>
        <Button variant="outline" nativeButton={false} render={<Link href="/vagas" />}>
          <ArrowLeft className="size-4" />
          Voltar ao mapa de vagas
        </Button>
      </div>

      <ImportarVagas unidades={unidades} />
    </div>
  );
}
