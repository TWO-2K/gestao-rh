"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { marcarComoLida, marcarTodasComoLidas } from "@/lib/actions/notificacoes";
import { TIPO_NOTIFICACAO_LABEL } from "@/lib/constants";
import { PushToggle } from "@/components/layout/push-toggle";
import type { Tables } from "@/types/database";

type Notificacao = Pick<
  Tables<"notificacoes">,
  "id" | "tipo" | "titulo" | "mensagem" | "vaga_id" | "lida" | "lida_em" | "created_at"
>;

function formatarDataHora(data: string) {
  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificacaoBell({
  notificacoes,
  contagemNaoLida,
}: {
  notificacoes: Notificacao[];
  contagemNaoLida: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function abrir(notificacao: Notificacao) {
    if (!notificacao.lida) {
      startTransition(async () => {
        await marcarComoLida(notificacao.id);
        router.refresh();
      });
    }
    setOpen(false);
  }

  function marcarTudo() {
    startTransition(async () => {
      await marcarTodasComoLidas();
      router.refresh();
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="relative size-8">
            <Bell className="size-4" />
            {contagemNaoLida > 0 && (
              <Badge className="absolute -top-1 -right-1 size-4 justify-center rounded-full p-0 text-[10px] bg-red-600 text-white dark:bg-red-600">
                {contagemNaoLida > 9 ? "9+" : contagemNaoLida}
              </Badge>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80 p-0">
        <PopoverHeader className="flex-row items-center justify-between px-3 pt-3">
          <PopoverTitle>Notificações</PopoverTitle>
          <div className="flex items-center gap-1">
            <PushToggle />
            {contagemNaoLida > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-1.5 text-xs"
                onClick={marcarTudo}
                disabled={isPending}
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </PopoverHeader>

        <div className="flex max-h-80 flex-col gap-1 overflow-y-auto px-2 pb-2">
          {notificacoes.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              Nenhuma notificação por aqui.
            </p>
          )}
          {notificacoes.map((n) => (
            <button
              key={n.id}
              onClick={() => abrir(n)}
              className="flex flex-col gap-0.5 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={n.lida ? "font-medium" : "font-semibold"}>{n.titulo}</span>
                {!n.lida && <span className="size-2 shrink-0 rounded-full bg-red-600" />}
              </div>
              <p className="text-xs text-muted-foreground">{n.mensagem}</p>
              <span className="text-[11px] text-muted-foreground">
                {TIPO_NOTIFICACAO_LABEL[n.tipo] ?? n.tipo} · {formatarDataHora(n.created_at)}
              </span>
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full rounded-t-none border-t text-xs"
          onClick={() => setOpen(false)}
          render={<Link href="/notificacoes" />}
        >
          Ver todas
        </Button>
      </PopoverContent>
    </Popover>
  );
}
