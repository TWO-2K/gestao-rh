"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { atualizarUnidade } from "@/lib/actions/unidades";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function EditarUnidadeDialog({
  id,
  nome,
  codigo,
}: {
  id: string;
  nome: string;
  codigo: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nomeEditado, setNomeEditado] = useState(nome);
  const [codigoEditado, setCodigoEditado] = useState(codigo ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await atualizarUnidade(id, nomeEditado, codigoEditado);
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Unidade atualizada");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setNomeEditado(nome);
          setCodigoEditado(codigo ?? "");
          setOpen(true);
        }}
      >
        <Pencil className="size-4" />
        Editar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar unidade</DialogTitle>
            <DialogDescription>Altere o nome ou código da unidade.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Nome da unidade</Label>
              <Input
                value={nomeEditado}
                onChange={(e) => setNomeEditado(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Código (opcional)</Label>
              <Input value={codigoEditado} onChange={(e) => setCodigoEditado(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
