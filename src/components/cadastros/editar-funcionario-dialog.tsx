"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { atualizarFuncionario } from "@/lib/actions/funcionarios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Opcao = { id: string; nome: string };

export function EditarFuncionarioDialog({
  id,
  nome,
  email,
  unidadeId,
  unidades,
}: {
  id: string;
  nome: string;
  email: string | null;
  unidadeId: string | null;
  unidades: Opcao[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nomeEditado, setNomeEditado] = useState(nome);
  const [emailEditado, setEmailEditado] = useState(email ?? "");
  const [unidadeIdEditada, setUnidadeIdEditada] = useState(unidadeId ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await atualizarFuncionario(id, nomeEditado, unidadeIdEditada, emailEditado);
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Funcionário atualizado");
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
          setEmailEditado(email ?? "");
          setUnidadeIdEditada(unidadeId ?? "");
          setOpen(true);
        }}
      >
        <Pencil className="size-4" />
        Editar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar funcionário</DialogTitle>
            <DialogDescription>Altere os dados do funcionário.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input
                value={nomeEditado}
                onChange={(e) => setNomeEditado(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">E-mail (opcional)</Label>
              <Input
                type="email"
                value={emailEditado}
                onChange={(e) => setEmailEditado(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Unidade (opcional)</Label>
              <Select
                value={unidadeIdEditada || null}
                onValueChange={(v) => setUnidadeIdEditada(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a unidade">
                    {(value: string | null) =>
                      unidades.find((u) => u.id === value)?.nome ?? "Selecione a unidade"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
