"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  assumirVaga,
  cancelarVaga,
  liberarVaga,
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
  recrutadorId = null,
  recrutadorNome = null,
  currentUserId,
}: {
  vagaId: string;
  situacao: SituacaoVaga;
  suspensa: boolean;
  variant?: "menu" | "buttons" | "card";
  isAdmin?: boolean;
  somenteLeitura?: boolean;
  recrutadorId?: string | null;
  recrutadorNome?: string | null;
  currentUserId?: string;
}) {
  const router = useRouter();
  const [motivoAcao, setMotivoAcao] = useState<MotivoAcao | null>(null);
  const [motivoTexto, setMotivoTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [fecharDialogAberto, setFecharDialogAberto] = useState(false);
  const [candidatoAprovado, setCandidatoAprovado] = useState("");
  const [dataAdmissao, setDataAdmissao] = useState("");
  const [dataFechamento, setDataFechamento] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  async function alterar(situacaoNova: "em_aberto") {
    const result = await alterarSituacaoVaga(vagaId, situacaoNova);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Situação da vaga atualizada");
    router.refresh();
  }

  function abrirFecharDialog() {
    setCandidatoAprovado("");
    setDataAdmissao("");
    setDataFechamento(new Date().toISOString().slice(0, 10));
    setFecharDialogAberto(true);
  }

  async function confirmarFechamento() {
    setEnviando(true);
    const result = await alterarSituacaoVaga(vagaId, "fechado", {
      data_fechamento: dataFechamento,
      data_admissao: dataAdmissao,
      candidato_aprovado: candidatoAprovado,
    });
    setEnviando(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Vaga fechada");
    setFecharDialogAberto(false);
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

  async function assumir() {
    const result = await assumirVaga(vagaId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Vaga assumida");
    router.refresh();
  }

  async function liberar() {
    const result = await liberarVaga(vagaId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Vaga liberada");
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

  const fecharDialog = (
    <Dialog open={fecharDialogAberto} onOpenChange={setFecharDialogAberto}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fechar vaga</DialogTitle>
          <DialogDescription>
            Informe quem foi admitido para calcular o acompanhamento do período de experiência.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Candidato(a) aprovado(a)</Label>
            <Input
              autoFocus
              value={candidatoAprovado}
              onChange={(e) => setCandidatoAprovado(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Data de fechamento</Label>
            <Input
              type="date"
              value={dataFechamento}
              onChange={(e) => setDataFechamento(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Data de admissão</Label>
            <Input
              type="date"
              value={dataAdmissao}
              onChange={(e) => setDataAdmissao(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setFecharDialogAberto(false)}>
            Voltar
          </Button>
          <Button
            disabled={!candidatoAprovado.trim() || !dataAdmissao || enviando}
            onClick={confirmarFechamento}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

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

  if (variant === "card" && somenteLeitura) {
    return (
      <p className="text-xs text-muted-foreground">
        Recrutador(a): {recrutadorNome ?? "Ninguém ainda"}
      </p>
    );
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
              onClick={abrirFecharDialog}
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

          {situacao !== "cancelado" && situacao !== "rejeitado" && (
            <Button
              size="sm"
              onClick={() => abrirMotivoDialog("cancelar")}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              <XCircle className="size-3.5" />
              Cancelar
            </Button>
          )}

          {!isAdmin && situacao === "em_aberto" && recrutadorId === null && (
            <Button size="sm" variant="outline" onClick={assumir}>
              <UserCheck className="size-3.5" />
              Assumir vaga
            </Button>
          )}
          {!isAdmin && situacao === "em_aberto" && recrutadorId === currentUserId && (
            <Button size="sm" variant="outline" onClick={liberar}>
              <UserX className="size-3.5" />
              Liberar vaga
            </Button>
          )}
        </div>
        {motivoDialog}
        {fecharDialog}
      </>
    );
  }

  if (variant === "card") {
    const podeAssumir = !isAdmin && situacao === "em_aberto" && recrutadorId === null;
    const podeLiberar = !isAdmin && situacao === "em_aberto" && recrutadorId === currentUserId;

    return (
      <>
        <div className="flex flex-col gap-2">
          {podeAssumir ? (
            <Button
              variant="link"
              size="sm"
              className="h-auto justify-start p-0 text-xs"
              onClick={assumir}
            >
              Assumir vaga →
            </Button>
          ) : podeLiberar ? (
            <p className="text-xs text-muted-foreground">
              Você está com esta vaga ·{" "}
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={liberar}>
                Liberar
              </Button>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Recrutador(a): {recrutadorNome ?? "Ninguém ainda"}
            </p>
          )}

          <div className="flex items-center gap-1.5">
            {situacao !== "fechado" ? (
              <Button
                size="sm"
                onClick={abrirFecharDialog}
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

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={alternarSuspensao}>
                  {suspensa ? "Reativar (remover suspensão)" : "Suspender vaga"}
                </DropdownMenuItem>
                {situacao !== "cancelado" && situacao !== "rejeitado" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => abrirMotivoDialog("cancelar")}
                    >
                      Cancelar vaga
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {motivoDialog}
        {fecharDialog}
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          {situacao !== "fechado" && (
            <DropdownMenuItem onClick={abrirFecharDialog}>Marcar como fechada</DropdownMenuItem>
          )}
          {situacao !== "em_aberto" && (
            <DropdownMenuItem onClick={() => alterar("em_aberto")}>
              Reabrir vaga
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={alternarSuspensao}>
            {suspensa ? "Reativar (remover suspensão)" : "Suspender vaga"}
          </DropdownMenuItem>
          {!isAdmin && situacao === "em_aberto" && recrutadorId === null && (
            <DropdownMenuItem onClick={assumir}>Assumir vaga</DropdownMenuItem>
          )}
          {!isAdmin && situacao === "em_aberto" && recrutadorId === currentUserId && (
            <DropdownMenuItem onClick={liberar}>Liberar vaga</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {situacao !== "cancelado" && situacao !== "rejeitado" && (
            <DropdownMenuItem variant="destructive" onClick={() => abrirMotivoDialog("cancelar")}>
              Cancelar vaga
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {motivoDialog}
      {fecharDialog}
    </>
  );
}
