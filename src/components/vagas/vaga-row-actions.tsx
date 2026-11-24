"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, MoreHorizontal, PauseCircle, PlayCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { alterarSituacaoVaga, alterarSuspensaoVaga } from "@/lib/actions/vagas";
import type { SituacaoVaga } from "@/types/database";

export function VagaRowActions({
  vagaId,
  situacao,
  suspensa,
  variant = "menu",
}: {
  vagaId: string;
  situacao: SituacaoVaga;
  suspensa: boolean;
  variant?: "menu" | "buttons";
}) {
  const router = useRouter();

  async function alterar(situacaoNova: SituacaoVaga) {
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

  if (variant === "buttons") {
    return (
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
            onClick={() => alterar("cancelado")}
            className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
          >
            <XCircle className="size-3.5" />
            Cancelar
          </Button>
        )}
      </div>
    );
  }

  return (
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
          <DropdownMenuItem
            variant="destructive"
            onClick={() => alterar("cancelado")}
          >
            Cancelar vaga
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
