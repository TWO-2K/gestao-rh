import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profile";
import { getVagas } from "@/lib/data/vagas";
import {
  getCargoSetorMap,
  getCargos,
  getFuncionarios,
  getHorariosTrabalho,
  getRecrutadores,
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
import type { MotivoVaga, SituacaoVaga } from "@/types/database";
import { cn } from "@/lib/utils";

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
  const isRecrutador = !isGestor && !isAdmin;
  // Diretoria só visualiza, aprova e rejeita — não edita dados da vaga.
  const somenteLeitura = isGestor || isDiretoria;
  const ehKanban = params.view !== "tabela" && !isGestor;

  const paginaParam = Number.parseInt(params.pagina ?? "1", 10);
  const pagina = Number.isFinite(paginaParam) && paginaParam > 0 ? paginaParam : 1;

  const filtro = {
    unidade_id: params.unidade_id,
    situacao: params.situacao as SituacaoVaga | undefined,
    setor_id: params.setor_id,
    cargo_id: params.cargo_id,
    motivo: params.motivo as MotivoVaga | undefined,
    horario_trabalho_id: params.horario_trabalho_id,
    gestor_id: params.gestor_id,
    status_sla: params.status_sla,
    busca: params.busca,
    suspensa: params.suspensa === "sim" ? true : params.suspensa === "nao" ? false : undefined,
    data_abertura_de: params.data_abertura_de,
    data_abertura_ate: params.data_abertura_ate,
    recrutador_id: isRecrutador
      ? (params.minhas === "sim" ? profile.id : undefined)
      : (isAdmin ? params.recrutador_id : undefined),
  };

  const [
    { vagas, total },
    unidades,
    cargos,
    setores,
    horariosTrabalho,
    funcionarios,
    cargoSetorMap,
    recrutadores,
  ] = await Promise.all([
    // Kanban mostra tudo (quebrar por páginas distorceria as colunas); a
    // tabela usa paginação real no banco (.range()).
    getVagas(filtro, ehKanban ? undefined : { pagina, porPagina: POR_PAGINA }),
    getUnidades(),
    getCargos(),
    getSetores(),
    getHorariosTrabalho(),
    getFuncionarios(),
    getCargoSetorMap(),
    isAdmin ? getRecrutadores() : Promise.resolve([]),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const gestores = funcionarios.filter((f) => f.eh_gestor);

  return (
    <div className={cn("flex flex-col gap-4", ehKanban && "lg:h-full lg:min-h-0")}>
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-semibold">{isGestor ? "Minhas solicitações" : "Mapa de Vagas"}</h1>
          <p className="text-sm text-muted-foreground">
            {total} vaga{total === 1 ? "" : "s"} encontrada
            {total === 1 ? "" : "s"}
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          {isGestor ? (
            <SolicitarVagaSheet
              cargos={cargos}
              setores={setores}
              horariosTrabalho={horariosTrabalho}
              cargoSetorMap={cargoSetorMap}
              trigger={
                <Button className="col-span-2 w-full sm:w-auto">
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
                  <Button
                    variant="outline"
                    nativeButton={false}
                    className="w-full sm:w-auto"
                    render={<Link href="/vagas/importar" />}
                  >
                    <Upload className="size-4" />
                    Importar planilha
                  </Button>
                  <VagaSheet
                    unidades={unidades}
                    cargos={cargos}
                    setores={setores}
                    horariosTrabalho={horariosTrabalho}
                    funcionarios={funcionarios}
                    cargoSetorMap={cargoSetorMap}
                    trigger={
                      <Button className="col-span-2 w-full sm:w-auto">
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

      <div className="shrink-0">
        <VagasFiltros
          unidades={unidades}
          setores={setores}
          cargos={cargos}
          horariosTrabalho={horariosTrabalho}
          gestores={gestores}
          recrutadores={recrutadores}
          somenteLeitura={isGestor}
          isRecrutador={isRecrutador}
          isAdmin={isAdmin}
        />
      </div>

      {ehKanban ? (
        <div className="lg:min-h-0 lg:flex-1 lg:overflow-hidden">
          <VagasKanban
            vagas={vagas}
            unidades={unidades}
            cargos={cargos}
            setores={setores}
            horariosTrabalho={horariosTrabalho}
            funcionarios={funcionarios}
            cargoSetorMap={cargoSetorMap}
            isAdmin={isAdmin}
            somenteLeitura={somenteLeitura}
            currentUserId={profile.id}
          />
        </div>
      ) : (
        <>
          <VagasTable
            vagas={vagas}
            unidades={unidades}
            cargos={cargos}
            setores={setores}
            horariosTrabalho={horariosTrabalho}
            funcionarios={funcionarios}
            cargoSetorMap={cargoSetorMap}
            somenteLeitura={somenteLeitura}
            isGestor={isGestor}
            isAdmin={isAdmin}
            currentUserId={profile.id}
          />
          <PaginationControls paginaAtual={pagina} totalPaginas={totalPaginas} />
        </>
      )}
    </div>
  );
}
