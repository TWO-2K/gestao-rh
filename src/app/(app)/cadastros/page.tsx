import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profile";
import {
  getAllFuncionarios,
  getAllUnidades,
  getCargosComSetores,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NovaUnidadeForm } from "@/components/cadastros/nova-unidade-form";
import { UnidadeAtivoToggle } from "@/components/cadastros/unidade-ativo-switch";
import { NovoFuncionarioForm } from "@/components/cadastros/novo-funcionario-form";
import { FuncionarioAtivoToggle } from "@/components/cadastros/funcionario-ativo-switch";
import { NovoCargoForm } from "@/components/cadastros/novo-cargo-form";
import { NovoSetorForm } from "@/components/cadastros/novo-setor-form";
import { SetorCard } from "@/components/cadastros/setor-card";

export default async function CadastrosPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.papel !== "admin_diretoria") {
    redirect("/vagas");
  }

  const [unidades, cargosComSetores, funcionarios, setores, vagasAbertasPorSetor] =
    await Promise.all([
      getAllUnidades(),
      getCargosComSetores(),
      getAllFuncionarios(),
      getSetores(),
      getVagasAbertasPorSetor(),
    ]);

  const unidadeNomePorId = new Map(unidades.map((u) => [u.id, u.nome]));

  const cargosPorNome = new Map<string, string[]>();
  const cargosCountPorSetorId = new Map<string, number>();
  for (const row of cargosComSetores) {
    const nomeCargo = (row.cargos as unknown as { nome: string } | null)?.nome;
    const nomeSetor = (row.setores as unknown as { nome: string } | null)?.nome;
    if (!nomeCargo || !nomeSetor) continue;
    if (!cargosPorNome.has(nomeCargo)) cargosPorNome.set(nomeCargo, []);
    cargosPorNome.get(nomeCargo)!.push(nomeSetor);
    cargosCountPorSetorId.set(row.setor_id, (cargosCountPorSetorId.get(row.setor_id) ?? 0) + 1);
  }
  const cargosOrdenados = [...cargosPorNome.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Cadastros</h1>
        <p className="text-sm text-muted-foreground">
          Unidades e catálogo de cargos/setores usados no Mapa de Vagas.
        </p>
      </div>

      <Tabs defaultValue="unidades">
        <TabsList>
          <TabsTrigger value="unidades">Unidades</TabsTrigger>
          <TabsTrigger value="setores">Setores</TabsTrigger>
          <TabsTrigger value="cargos">Cargos</TabsTrigger>
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
        </TabsList>

        <TabsContent value="unidades" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <NovaUnidadeForm />
          </div>

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
                <CardContent>
                  <UnidadeAtivoToggle id={u.id} ativo={u.ativo} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="setores" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <NovoSetorForm />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {setores.map((s) => (
              <SetorCard
                key={s.id}
                id={s.id}
                nome={s.nome}
                cargosCount={cargosCountPorSetorId.get(s.id) ?? 0}
                vagasAbertasCount={vagasAbertasPorSetor[s.id] ?? 0}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cargos" className="flex flex-col gap-4">
          <div className="flex justify-end gap-2">
            <NovoCargoForm setores={setores} />
          </div>

          <div className="overflow-hidden rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Setores onde é usado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargosOrdenados.map(([cargo, setoresDoCargo]) => (
                  <TableRow key={cargo}>
                    <TableCell className="font-medium">{cargo}</TableCell>
                    <TableCell className="flex flex-wrap gap-1">
                      {setoresDoCargo.map((s) => (
                        <Badge key={s} variant="outline">
                          {s}
                        </Badge>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="funcionarios" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <NovoFuncionarioForm unidades={unidades} />
          </div>

          <div className="overflow-hidden rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32" />
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
                      <Badge variant={f.ativo ? "default" : "secondary"}>
                        {f.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <FuncionarioAtivoToggle id={f.id} ativo={f.ativo} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
