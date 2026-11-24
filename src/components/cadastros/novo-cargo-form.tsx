"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { criarCargo } from "@/lib/actions/cargos";
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
  DialogTrigger,
} from "@/components/ui/dialog";

type Opcao = { id: string; nome: string };

export function NovoCargoForm({ setores }: { setores: Opcao[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [setorIds, setSetorIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function toggleSetor(id: string) {
    setSetorIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await criarCargo(nome, setorIds);
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Cargo cadastrado");
    setNome("");
    setSetorIds([]);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Novo cargo</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo cargo</DialogTitle>
          <DialogDescription>
            Um cargo pode existir em mais de um setor (ex.: Operador de loja em Frios, Salão).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Nome do cargo</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Operador de loja"
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
                      checked={setorIds.includes(s.id)}
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
              {submitting ? "Salvando..." : "Adicionar cargo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
