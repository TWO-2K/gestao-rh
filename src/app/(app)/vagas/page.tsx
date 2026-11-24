import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profile";
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
import { VagasKanban } from "@/components/vagas/vagas-kanban";
import { ExportarVagas } from "@/components/vagas/exportar-vagas";
import { VagaSheet } from "@/components/vagas/vaga-sheet";
import { SolicitarVagaSheet } from "@/components/vagas/solicitar-vaga-sheet";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import Link from "next/link";
import type { SituacaoVaga } from "@/types/database";

const POR_PAGINA = 20;

export default async function VagasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const isGestor = profile.papel === "gestor";
  const isDiretoria = profile.papel === "diretoria";
  const isAdmin = profile.papel === "admin" || isDiretoria;
  // Diretoria só visualiza, aprova e rejeita — não edita dados da vaga.
  const somenteLeitura = isGestor || isDiretoria;
  const ehKanban = params.view === "kanban" && !isGestor;

  const paginaParam = Number.parseInt(params.pagina ?? "1", 10);
  const pagina = Number.isFinite(paginaParam) && paginaParam > 0 ? paginaParam : 1;

  const filtro = {
    unidade_id: params.unidade_id,
    situacao: params.situacao as SituacaoVaga | undefined,
    setor_id: params.setor_id,
    busca: params.busca,
    suspensa: params.suspensa === "sim" ? true : params.suspensa === "nao" ? false : undefined,
  };

  const [{ vagas, total }, unidades, cargos, setores, funcionarios, cargoSetorMap] =
    await Promise.all([
      // Kanban mostra tudo (quebrar por páginas distorceria as colunas); a
      // tabela usa paginação real no banco (.range()).
      getVagas(filtro, ehKanban ? undefined : { pagina, porPagina: POR_PAGINA }),
      getUnidades(),
      getCargos(),
      getSetores(),
      getFuncionarios(),
      getCargoSetorMap(),
    ]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{isGestor ? "Minhas solicitações" : "Mapa de Vagas"}</h1>
          <p className="text-sm text-muted-foreground">
            {total} vaga{total === 1 ? "" : "s"} encontrada
            {total === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isGestor ? (
            <SolicitarVagaSheet
              cargos={cargos}
              setores={setores}
              cargoSetorMap={cargoSetorMap}
              trigger={
                <Button>
                  <Plus className="size-4" />
                  Solicitar vaga
                </Button>
              }
            />
          ) : (
            <>
              <ExportarVagas filtro={filtro} />
              {!isDiretoria && (
                <>
                  <Button variant="outline" nativeButton={false} render={<Link href="/vagas/importar" />}>
                    <Upload className="size-4" />
                    Importar planilha
                  </Button>
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
                </>
              )}
            </>
          )}
        </div>
      </div>

      <VagasFiltros unidades={unidades} setores={setores} somenteLeitura={isGestor} />

      {ehKanban ? (
        <VagasKanban
          vagas={vagas}
          unidades={unidades}
          cargos={cargos}
          setores={setores}
          funcionarios={funcionarios}
          cargoSetorMap={cargoSetorMap}
          isAdmin={isAdmin}
          somenteLeitura={somenteLeitura}
        />
      ) : (
        <>
          <VagasTable
            vagas={vagas}
            unidades={unidades}
            cargos={cargos}
            setores={setores}
            funcionarios={funcionarios}
            cargoSetorMap={cargoSetorMap}
            somenteLeitura={somenteLeitura}
            isGestor={isGestor}
            isAdmin={isAdmin}
          />
          <PaginationControls paginaAtual={pagina} totalPaginas={totalPaginas} />
        </>
      )}
    </div>
  );
}
