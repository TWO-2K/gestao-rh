import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profile";
import {
  getAllUnidades,
  getCargoSetorMap,
  getCargosComSetores,
  getCargosPaginado,
  getFuncionariosPaginado,
  getHorariosTrabalho,
  getSetores,
  getVagasAbertasPorSetor,
} from "@/lib/data/lookups";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { CadastrosTabs } from "@/components/cadastros/cadastros-tabs";
import { NovaUnidadeForm } from "@/components/cadastros/nova-unidade-form";
import { UnidadeAtivoToggle } from "@/components/cadastros/unidade-ativo-switch";
import { EditarUnidadeDialog } from "@/components/cadastros/editar-unidade-dialog";
import { NovoFuncionarioForm } from "@/components/cadastros/novo-funcionario-form";
import { FuncionarioAtivoToggle } from "@/components/cadastros/funcionario-ativo-switch";
import { EditarFuncionarioDialog } from "@/components/cadastros/editar-funcionario-dialog";
import { NovoCargoForm } from "@/components/cadastros/novo-cargo-form";
import { EditarCargoDialog } from "@/components/cadastros/editar-cargo-dialog";
import { NovoSetorForm } from "@/components/cadastros/novo-setor-form";
import { SetorCard } from "@/components/cadastros/setor-card";
import { NovoHorarioTrabalhoForm } from "@/components/cadastros/novo-horario-trabalho-form";
import { EditarHorarioTrabalhoDialog } from "@/components/cadastros/editar-horario-trabalho-dialog";
import { PaginationControls } from "@/components/shared/pagination-controls";

const POR_PAGINA = 20;

function paginaDaUrl(valor: string | undefined) {
  const n = Number.parseInt(valor ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function CadastrosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile || (profile.papel !== "admin" && profile.papel !== "diretoria")) {
    redirect("/vagas");
  }
  // Diretoria só visualiza cadastros — não cria nem edita nada aqui.
  const isAdmin = profile.papel === "admin";

  const paginaCargos = paginaDaUrl(params.pagina_cargos);
  const paginaFuncionarios = paginaDaUrl(params.pagina_funcionarios);

  const [
    unidades,
    cargosComSetores,
    { data: cargosOrdenados, total: totalCargos },
    cargoSetorMap,
    { data: funcionarios, total: totalFuncionarios },
    setores,
    horariosTrabalho,
    vagasAbertasPorSetor,
  ] = await Promise.all([
    getAllUnidades(),
    getCargosComSetores(),
    getCargosPaginado(paginaCargos, POR_PAGINA),
    getCargoSetorMap(),
    getFuncionariosPaginado(paginaFuncionarios, POR_PAGINA),
    getSetores(),
    getHorariosTrabalho(),
    getVagasAbertasPorSetor(),
  ]);

  const unidadeNomePorId = new Map(unidades.map((u) => [u.id, u.nome]));
  const setorNomePorId = new Map(setores.map((s) => [s.id, s.nome]));

  const cargosCountPorSetorId = new Map<string, number>();
  for (const row of cargosComSetores) {
    cargosCountPorSetorId.set(row.setor_id, (cargosCountPorSetorId.get(row.setor_id) ?? 0) + 1);
  }

  const totalPaginasCargos = Math.max(1, Math.ceil(totalCargos / POR_PAGINA));
  const totalPaginasFuncionarios = Math.max(1, Math.ceil(totalFuncionarios / POR_PAGINA));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Cadastros</h1>
        <p className="text-sm text-muted-foreground">
          Unidades e catálogo de cargos/setores usados no Mapa de Vagas.
        </p>
      </div>

      <CadastrosTabs
        unidadesAction={isAdmin ? <NovaUnidadeForm /> : undefined}
        setoresAction={isAdmin ? <NovoSetorForm /> : undefined}
        cargosAction={isAdmin ? <NovoCargoForm setores={setores} /> : undefined}
        horariosTrabalhoAction={isAdmin ? <NovoHorarioTrabalhoForm /> : undefined}
        funcionariosAction={isAdmin ? <NovoFuncionarioForm unidades={unidades} /> : undefined}
        unidadesContent={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unidades.map((u) => (
              <Card key={u.id} className="border-t-4 border-t-primary">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="size-5" />
                      </div>
                      <div>
                        <p className="font-heading text-base font-medium">{u.nome}</p>
                        <p className="text-xs text-muted-foreground">{u.codigo ?? "—"}</p>
                      </div>
                    </div>
                    <Badge variant={u.ativo ? "default" : "secondary"}>
                      {u.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                </CardHeader>
                {isAdmin && (
                  <CardContent className="flex items-center gap-2">
                    <EditarUnidadeDialog id={u.id} nome={u.nome} codigo={u.codigo} />
                    <UnidadeAtivoToggle id={u.id} ativo={u.ativo} />
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        }
        setoresContent={
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {setores.map((s) => (
              <SetorCard
                key={s.id}
                id={s.id}
                nome={s.nome}
                cargosCount={cargosCountPorSetorId.get(s.id) ?? 0}
                vagasAbertasCount={vagasAbertasPorSetor[s.id] ?? 0}
                somenteLeitura={!isAdmin}
              />
            ))}
          </div>
        }
        cargosContent={
          <div className="overflow-x-auto rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Setores onde é usado</TableHead>
                  {isAdmin && <TableHead className="w-28" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargosOrdenados.map((cargo) => {
                  const setorIdsDoCargo = cargoSetorMap[cargo.id] ?? [];
                  return (
                    <TableRow key={cargo.id}>
                      <TableCell className="font-medium">{cargo.nome}</TableCell>
                      <TableCell className="flex flex-wrap gap-1">
                        {setorIdsDoCargo.map((setorId) => (
                          <Badge key={setorId} variant="outline">
                            {setorNomePorId.get(setorId) ?? "—"}
                          </Badge>
                        ))}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <EditarCargoDialog
                            id={cargo.id}
                            nome={cargo.nome}
                            setorIds={setorIdsDoCargo}
                            setores={setores}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="px-4">
              <PaginationControls
                paginaAtual={paginaCargos}
                totalPaginas={totalPaginasCargos}
                paramName="pagina_cargos"
              />
            </div>
          </div>
        }
        horariosTrabalhoContent={
          <div className="overflow-x-auto rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horário de trabalho</TableHead>
                  {isAdmin && <TableHead className="w-36" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {horariosTrabalho.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.nome}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <EditarHorarioTrabalhoDialog id={h.id} nome={h.nome} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        }
        funcionariosContent={
          <div className="overflow-x-auto rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Gestor</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="w-56" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {funcionarios.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.nome}</TableCell>
                    <TableCell>{f.email ?? "—"}</TableCell>
                    <TableCell>
                      {f.unidade_id ? unidadeNomePorId.get(f.unidade_id) ?? "—" : "—"}
                    </TableCell>
                    <TableCell>
                      {f.eh_gestor ? <Badge variant="outline">Gestor</Badge> : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={f.ativo ? "default" : "secondary"}>
                        {f.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <EditarFuncionarioDialog
                            id={f.id}
                            nome={f.nome}
                            email={f.email}
                            unidadeId={f.unidade_id}
                            ehGestor={f.eh_gestor}
                            unidades={unidades}
                          />
                          <FuncionarioAtivoToggle id={f.id} ativo={f.ativo} />
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-4">
              <PaginationControls
                paginaAtual={paginaFuncionarios}
                totalPaginas={totalPaginasFuncionarios}
                paramName="pagina_funcionarios"
              />
            </div>
          </div>
        }
      />
    </div>
  );
}
