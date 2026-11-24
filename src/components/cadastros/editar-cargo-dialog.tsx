"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { atualizarCargo } from "@/lib/actions/cargos";
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

type Opcao = { id: string; nome: string };

export function EditarCargoDialog({
  id,
  nome,
  setorIds,
  setores,
}: {
  id: string;
  nome: string;
  setorIds: string[];
  setores: Opcao[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nomeEditado, setNomeEditado] = useState(nome);
  const [setorIdsEditados, setSetorIdsEditados] = useState<string[]>(setorIds);
  const [submitting, setSubmitting] = useState(false);

  function toggleSetor(setorId: string) {
    setSetorIdsEditados((prev) =>
      prev.includes(setorId) ? prev.filter((s) => s !== setorId) : [...prev, setorId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await atualizarCargo(id, nomeEditado, setorIdsEditados);
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Cargo atualizado");
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
          setSetorIdsEditados(setorIds);
          setOpen(true);
        }}
      >
        <Pencil className="size-4" />
        Editar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cargo</DialogTitle>
            <DialogDescription>
              Um cargo pode existir em mais de um setor (ex.: Operador de loja em Frios, Salão).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Nome do cargo</Label>
              <Input
                value={nomeEditado}
                onChange={(e) => setNomeEditado(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Setores</Label>
              <div className="flex flex-wrap gap-3">
                {setores.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Nenhum setor cadastrado</span>
                ) : (
                  setores.map((s) => (
                    <label key={s.id} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={setorIdsEditados.includes(s.id)}
                        onChange={() => toggleSetor(s.id)}
                        className="size-4 rounded border-input"
                      />
                      {s.nome}
                    </label>
                  ))
                )}
              </div>
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
