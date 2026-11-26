"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MoreHorizontal, PauseCircle, PlayCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  alterarSituacaoVaga,
  alterarSuspensaoVaga,
  aprovarVaga,
  cancelarVaga,
  rejeitarVaga,
} from "@/lib/actions/vagas";
import type { SituacaoVaga } from "@/types/database";

type MotivoAcao = "cancelar" | "rejeitar";

export function VagaRowActions({
  vagaId,
  situacao,
  suspensa,
  variant = "menu",
  isAdmin = false,
  somenteLeitura = false,
}: {
  vagaId: string;
  situacao: SituacaoVaga;
  suspensa: boolean;
  variant?: "menu" | "buttons";
  isAdmin?: boolean;
  somenteLeitura?: boolean;
}) {
  const router = useRouter();
  const [motivoAcao, setMotivoAcao] = useState<MotivoAcao | null>(null);
  const [motivoTexto, setMotivoTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function alterar(situacaoNova: "em_aberto" | "fechado") {
    const result = await alterarSituacaoVaga(vagaId, situacaoNova);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Situação da vaga atualizada");
    router.refresh();
  }

  async function alternarSuspensao() {
    const result = await alterarSuspensaoVaga(vagaId, !suspensa);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(suspensa ? "Vaga reativada" : "Vaga suspensa");
    router.refresh();
  }

  async function aprovar() {
    const result = await aprovarVaga(vagaId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Vaga aprovada e liberada para recrutamento");
    router.refresh();
  }

  function abrirMotivoDialog(acao: MotivoAcao) {
    setMotivoTexto("");
    setMotivoAcao(acao);
  }

  async function confirmarMotivo() {
    const motivo = motivoTexto.trim();
    if (!motivo) return;

    setEnviando(true);
    const result =
      motivoAcao === "cancelar"
        ? await cancelarVaga(vagaId, motivo)
        : await rejeitarVaga(vagaId, motivo);
    setEnviando(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(motivoAcao === "cancelar" ? "Vaga cancelada" : "Vaga rejeitada");
    setMotivoAcao(null);
    router.refresh();
  }

  const motivoDialog = (
    <Dialog
      open={motivoAcao !== null}
      onOpenChange={(open) => {
        if (!open) setMotivoAcao(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {motivoAcao === "cancelar" ? "Cancelar vaga" : "Rejeitar solicitação"}
          </DialogTitle>
          <DialogDescription>
            {motivoAcao === "cancelar"
              ? "Informe o motivo do cancelamento. O gestor que solicitou a vaga será notificado."
              : "Informe o motivo da rejeição. O gestor que solicitou a vaga será notificado."}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          autoFocus
          placeholder="Motivo..."
          value={motivoTexto}
          onChange={(e) => setMotivoTexto(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setMotivoAcao(null)}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            disabled={!motivoTexto.trim() || enviando}
            onClick={confirmarMotivo}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (situacao === "pendente_aprovacao" && isAdmin) {
    return (
      <>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            onClick={aprovar}
            className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            <CheckCircle2 className="size-3.5" />
            Aprovar
          </Button>
          <Button size="sm" variant="destructive" onClick={() => abrirMotivoDialog("rejeitar")}>
            <XCircle className="size-3.5" />
            Rejeitar
          </Button>
        </div>
        {motivoDialog}
      </>
    );
  }

  if (situacao === "pendente_aprovacao") {
    return null;
  }

  if (somenteLeitura) {
    return null;
  }

  if (variant === "buttons") {
    return (
      <>
        <div className="flex flex-wrap items-center gap-1.5">
          {situacao !== "fechado" ? (
            <Button
              size="sm"
              onClick={() => alterar("fechado")}
              className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
            >
              <CheckCircle2 className="size-3.5" />
              Fechar
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => alterar("em_aberto")}
              className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <PlayCircle className="size-3.5" />
              Reabrir
            </Button>
          )}

          <Button
            size="sm"
            onClick={alternarSuspensao}
            className={
              suspensa
                ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                : "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600"
            }
          >
            {suspensa ? <PlayCircle className="size-3.5" /> : <PauseCircle className="size-3.5" />}
            {suspensa ? "Reativar" : "Suspender"}
          </Button>

          {situacao !== "cancelado" && (
            <Button
              size="sm"
              onClick={() => abrirMotivoDialog("cancelar")}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              <XCircle className="size-3.5" />
              Cancelar
            </Button>
          )}
        </div>
        {motivoDialog}
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          {situacao !== "fechado" && (
            <DropdownMenuItem onClick={() => alterar("fechado")}>
              Marcar como fechada
            </DropdownMenuItem>
          )}
          {situacao !== "em_aberto" && (
            <DropdownMenuItem onClick={() => alterar("em_aberto")}>
              Reabrir vaga
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={alternarSuspensao}>
            {suspensa ? "Reativar (remover suspensão)" : "Suspender vaga"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {situacao !== "cancelado" && (
            <DropdownMenuItem variant="destructive" onClick={() => abrirMotivoDialog("cancelar")}>
              Cancelar vaga
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {motivoDialog}
    </>
  );
}
