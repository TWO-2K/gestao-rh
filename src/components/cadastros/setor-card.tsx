"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Layers, Pencil, Trash2 } from "lucide-react";
import { atualizarSetor, excluirSetor } from "@/lib/actions/cargos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SetorCard({
  id,
  nome,
  cargosCount,
  vagasAbertasCount,
  somenteLeitura = false,
}: {
  id: string;
  nome: string;
  cargosCount: number;
  vagasAbertasCount: number;
  somenteLeitura?: boolean;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [nomeEditado, setNomeEditado] = useState(nome);
  const [submitting, setSubmitting] = useState(false);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await atualizarSetor(id, nomeEditado);
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Setor atualizado");
    setEditOpen(false);
    router.refresh();
  }

  async function handleExcluir() {
    const result = await excluirSetor(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Setor excluído");
    router.refresh();
  }

  return (
    <>
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="size-5" />
            </div>
            <div>
              <p className="font-heading text-base font-medium">{nome}</p>
              <p className="text-xs text-muted-foreground">Descrição não informada</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 py-3">
              <span className="text-xl font-semibold text-primary">{cargosCount}</span>
              <span className="text-xs text-muted-foreground">Cargos</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 py-3">
              <span className="text-xl font-semibold">{vagasAbertasCount}</span>
              <span className="text-xs text-muted-foreground">Vagas abertas</span>
            </div>
          </div>
          {!somenteLeitura && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setNomeEditado(nome);
                  setEditOpen(true);
                }}
              >
                <Pencil className="size-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar setor</DialogTitle>
            <DialogDescription>Altere o nome do setor.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalvar} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Nome do setor</Label>
              <Input
                value={nomeEditado}
                onChange={(e) => setNomeEditado(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir setor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o setor &quot;{nome}&quot; permanentemente. Setores vinculados a
              cargos ou vagas não podem ser excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleExcluir}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
