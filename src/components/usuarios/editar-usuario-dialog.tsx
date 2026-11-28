"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { atualizarUsuario } from "@/lib/actions/usuarios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PapelUsuario } from "@/types/database";

type Opcao = { id: string; nome: string };

export function EditarUsuarioDialog({
  id,
  nomeAtual,
  papelAtual,
  unidadeIdsAtuais,
  unidades,
  papelAtor,
}: {
  id: string;
  nomeAtual: string;
  papelAtual: PapelUsuario;
  unidadeIdsAtuais: string[];
  unidades: Opcao[];
  papelAtor: PapelUsuario;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState(nomeAtual);
  const [papel, setPapel] = useState(papelAtual);
  const [unidadeIds, setUnidadeIds] = useState<string[]>(unidadeIdsAtuais);
  const [submitting, setSubmitting] = useState(false);

  function toggleUnidade(unidadeId: string) {
    setUnidadeIds((prev) =>
      prev.includes(unidadeId) ? prev.filter((u) => u !== unidadeId) : [...prev, unidadeId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await atualizarUsuario({ id, nome, papel, unidadeIds });
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Usuário atualizado");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Pencil className="size-3.5" />
            Editar
          </Button>
        }
      />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Nome</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Papel</Label>
            <Select value={papel} onValueChange={(v) => setPapel(v as typeof papel)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(papelAtor === "admin" || papelAtual === "admin") && (
                  <SelectItem value="admin">Administrador</SelectItem>
                )}
                <SelectItem value="diretoria">Diretoria</SelectItem>
                <SelectItem value="gerente">Gerente</SelectItem>
                <SelectItem value="gestor">Gestor(a) solicitante</SelectItem>
                <SelectItem value="recrutador">Recrutador(a)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Unidades com acesso</Label>
            <div className="flex flex-wrap gap-3">
              {unidades.map((u) => (
                <label key={u.id} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={unidadeIds.includes(u.id)}
                    onChange={() => toggleUnidade(u.id)}
                    className="size-4 rounded border-input"
                  />
                  {u.nome}
                </label>
              ))}
            </div>
          </div>
          <Button type="submit" disabled={submitting} className="w-fit">
            {submitting ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
