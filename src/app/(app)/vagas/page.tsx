import { getVagas } from "@/lib/data/vagas";
import {
  getCargoSetorMap,
  getCargos,
  getFuncionarios,
  getSetores,
  getUnidades,
} from "@/lib/data/lookups";
import { VagasFiltros } from "@/components/vagas/vagas-filtros";
import { VagasTable } from "@/components/vagas/vagas-table";
import { VagaSheet } from "@/components/vagas/vaga-sheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function VagasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const [vagas, unidades, cargos, setores, funcionarios, cargoSetorMap] = await Promise.all([
    getVagas({
      unidade_id: params.unidade_id,
      situacao: params.situacao as "em_aberto" | "fechado" | "cancelado" | undefined,
      setor_id: params.setor_id,
      busca: params.busca,
    }),
    getUnidades(),
    getCargos(),
    getSetores(),
    getFuncionarios(),
    getCargoSetorMap(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Mapa de Vagas</h1>
          <p className="text-sm text-muted-foreground">
            {vagas.length} vaga{vagas.length === 1 ? "" : "s"} encontrada
            {vagas.length === 1 ? "" : "s"}
          </p>
        </div>
        <VagaSheet
          unidades={unidades}
          cargos={cargos}
          setores={setores}
          funcionarios={funcionarios}
          cargoSetorMap={cargoSetorMap}
          trigger={
            <Button>
              <Plus className="size-4" />
              Nova vaga
            </Button>
          }
        />
      </div>

      <VagasFiltros unidades={unidades} setores={setores} />

      <VagasTable
        vagas={vagas}
        unidades={unidades}
        cargos={cargos}
        setores={setores}
        funcionarios={funcionarios}
        cargoSetorMap={cargoSetorMap}
      />
    </div>
  );
}
