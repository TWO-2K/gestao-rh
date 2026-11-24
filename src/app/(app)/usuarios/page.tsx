import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profile";
import { getUsuarios } from "@/lib/data/usuarios";
import { getAllUnidades, getFuncionarios } from "@/lib/data/lookups";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PAPEL_BADGE_VARIANT, PAPEL_LABEL } from "@/lib/constants";
import { NovoUsuarioForm } from "@/components/usuarios/novo-usuario-form";
import { EditarUsuarioDialog } from "@/components/usuarios/editar-usuario-dialog";
import { RedefinirSenhaDialog } from "@/components/usuarios/redefinir-senha-dialog";
import { BloqueioToggle } from "@/components/usuarios/bloqueio-toggle";

export default async function UsuariosPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.papel !== "admin_diretoria") {
    redirect("/vagas");
  }

  const [usuarios, unidades, funcionarios] = await Promise.all([
    getUsuarios(),
    getAllUnidades(),
    getFuncionarios(),
  ]);

  const funcionarioIdsPromovidos = new Set(
    usuarios.map((u) => u.funcionario_id).filter((id): id is string => !!id)
  );
  const funcionariosDisponiveis = funcionarios.filter(
    (f) => !funcionarioIdsPromovidos.has(f.id)
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Contas de acesso ao sistema, papel e unidades que cada recrutador(a) pode ver.
          </p>
        </div>
        <NovoUsuarioForm unidades={unidades} funcionarios={funcionariosDisponiveis} />
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Unidades</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-96" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.nome}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("border", PAPEL_BADGE_VARIANT[u.papel])}>
                    {PAPEL_LABEL[u.papel]}
                  </Badge>
                </TableCell>
                <TableCell className="flex flex-wrap gap-1">
                  {u.unidades.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Todas</span>
                  ) : (
                    u.unidades.map((un) => (
                      <Badge key={un.id} variant="outline">
                        {un.nome}
                      </Badge>
                    ))
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={u.bloqueado ? "secondary" : "default"}>
                    {u.bloqueado ? "Bloqueado" : "Ativo"}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-2">
                  <EditarUsuarioDialog
                    id={u.id}
                    nomeAtual={u.nome}
                    papelAtual={u.papel}
                    unidadeIdsAtuais={u.unidades.map((un) => un.id)}
                    unidades={unidades}
                  />
                  <RedefinirSenhaDialog id={u.id} />
                  <BloqueioToggle id={u.id} bloqueado={u.bloqueado} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
