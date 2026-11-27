"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { criarUsuario } from "@/lib/actions/usuarios";
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
  DialogTrigger,
} from "@/components/ui/dialog";

type Opcao = { id: string; nome: string };
type FuncionarioOpcao = { id: string; nome: string; email: string | null };

export function NovoUsuarioForm({
  unidades,
  funcionarios,
  papelAtor,
}: {
  unidades: Opcao[];
  funcionarios: FuncionarioOpcao[];
  papelAtor: "admin" | "diretoria" | "recrutador" | "gestor";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [funcionarioId, setFuncionarioId] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [papel, setPapel] = useState<"admin" | "diretoria" | "recrutador" | "gestor">("recrutador");
  const [unidadeIds, setUnidadeIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function toggleUnidade(id: string) {
    setUnidadeIds((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!funcionarioId) {
      toast.error("Selecione o funcionário a promover");
      return;
    }
    setSubmitting(true);
    const result = await criarUsuario({ funcionarioId, email, senha, papel, unidadeIds });
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Usuário criado");
    setFuncionarioId("");
    setEmail("");
    setSenha("");
    setPapel("recrutador");
    setUnidadeIds([]);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Novo usuário</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
          <DialogDescription>
            O funcionário precisa já estar cadastrado em Cadastros → Funcionários. Ao
            selecionar, o e-mail cadastrado é preenchido automaticamente; se o funcionário
            ainda não tiver e-mail, informe um aqui.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Funcionário</Label>
            <Select
              value={funcionarioId || null}
              onValueChange={(v) => {
                setFuncionarioId(v ?? "");
                setEmail(funcionarios.find((f) => f.id === v)?.email ?? "");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o funcionário">
                  {(value: string | null) =>
                    funcionarios.find((f) => f.id === value)?.nome ?? "Selecione o funcionário"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {funcionarios.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    Nenhum funcionário disponível
                  </div>
                ) : (
                  funcionarios.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@maisbarato.com"
              disabled={!!funcionarios.find((f) => f.id === funcionarioId)?.email}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Senha inicial</Label>
            <Input
              type="text"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Papel</Label>
            <Select value={papel} onValueChange={(v) => setPapel(v as typeof papel)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recrutador">Recrutador(a)</SelectItem>
                <SelectItem value="diretoria">Diretoria</SelectItem>
                <SelectItem value="gestor">Gestor(a) solicitante</SelectItem>
                {papelAtor === "admin" && (
                  <SelectItem value="admin">Administrador</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Unidades com acesso
              {papel === "gestor" && " (gestor usa a unidade do próprio cadastro de funcionário)"}
            </Label>
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

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Criando..." : "Criar usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
