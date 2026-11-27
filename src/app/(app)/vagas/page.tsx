import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profile";
import { getVagas, type VagasFiltro } from "@/lib/data/vagas";
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
import { Skeleton } from "@/components/ui/skeleton";
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

  return (
    <div className={cn("flex flex-col gap-4", ehKanban && "lg:h-full lg:min-h-0")}>
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-semibold">{isGestor ? "Minhas solicitações" : "Mapa de Vagas"}</h1>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          {isGestor ? (
            <Suspense fallback={<Skeleton className="col-span-2 h-9 w-full sm:w-36" />}>
              <SolicitarVagaAcao />
            </Suspense>
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
                  <Suspense fallback={<Skeleton className="col-span-2 h-9 w-full sm:w-32" />}>
                    <NovaVagaAcao />
                  </Suspense>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <Suspense fallback={<Skeleton className="h-10 w-full sm:w-80" />}>
          <VagasFiltrosSection isGestor={isGestor} isRecrutador={isRecrutador} isAdmin={isAdmin} />
        </Suspense>
      </div>

      <Suspense
        key={JSON.stringify({ filtro, pagina, ehKanban })}
        fallback={<VagasConteudoSkeleton ehKanban={ehKanban} />}
      >
        <VagasConteudo
          filtro={filtro}
          pagina={pagina}
          ehKanban={ehKanban}
          isAdmin={isAdmin}
          isGestor={isGestor}
          somenteLeitura={somenteLeitura}
          currentUserId={profile.id}
        />
      </Suspense>
    </div>
  );
}

// Cada ação/slice do cabeçalho busca só o que precisa; as lookups cacheadas
// (unstable_cache) e as deduplicadas via cache() do React (getFuncionarios,
// getRecrutadores) garantem que isso não vira query duplicada por request.

async function NovaVagaAcao() {
  const [unidades, cargos, setores, horariosTrabalho, funcionarios, cargoSetorMap] =
    await Promise.all([
      getUnidades(),
      getCargos(),
      getSetores(),
      getHorariosTrabalho(),
      getFuncionarios(),
      getCargoSetorMap(),
    ]);

  return (
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
  );
}

async function SolicitarVagaAcao() {
  const [cargos, setores, horariosTrabalho, cargoSetorMap] = await Promise.all([
    getCargos(),
    getSetores(),
    getHorariosTrabalho(),
    getCargoSetorMap(),
  ]);

  return (
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
  );
}

async function VagasFiltrosSection({
  isGestor,
  isRecrutador,
  isAdmin,
}: {
  isGestor: boolean;
  isRecrutador: boolean;
  isAdmin: boolean;
}) {
  const [unidades, cargos, setores, horariosTrabalho, funcionarios, recrutadores] =
    await Promise.all([
      getUnidades(),
      getCargos(),
      getSetores(),
      getHorariosTrabalho(),
      getFuncionarios(),
      isAdmin ? getRecrutadores() : Promise.resolve([]),
    ]);
  const gestores = funcionarios.filter((f) => f.eh_gestor);

  return (
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
  );
}

async function VagasConteudo({
  filtro,
  pagina,
  ehKanban,
  isAdmin,
  isGestor,
  somenteLeitura,
  currentUserId,
}: {
  filtro: VagasFiltro;
  pagina: number;
  ehKanban: boolean;
  isAdmin: boolean;
  isGestor: boolean;
  somenteLeitura: boolean;
  currentUserId: string;
}) {
  const [{ vagas, total }, unidades, cargos, setores, horariosTrabalho, funcionarios, cargoSetorMap] =
    await Promise.all([
      getVagas(
        filtro,
        // Kanban mostra tudo (quebrar por páginas distorceria as colunas); a
        // tabela usa paginação real no banco (.range()).
        ehKanban ? undefined : { pagina, porPagina: POR_PAGINA }
      ),
      getUnidades(),
      getCargos(),
      getSetores(),
      getHorariosTrabalho(),
      getFuncionarios(),
      getCargoSetorMap(),
    ]);
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <>
      <p className="-mt-2 shrink-0 text-sm text-muted-foreground">
        {total} vaga{total === 1 ? "" : "s"} encontrada
        {total === 1 ? "" : "s"}
      </p>

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
            currentUserId={currentUserId}
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
            currentUserId={currentUserId}
          />
          <PaginationControls paginaAtual={pagina} totalPaginas={totalPaginas} />
        </>
      )}
    </>
  );
}

function VagasConteudoSkeleton({ ehKanban }: { ehKanban: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="-mt-2 h-4 w-28" />
      {ehKanban ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : (
        Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
      )}
    </div>
  );
}
