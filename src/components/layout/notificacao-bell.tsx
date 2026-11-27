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
import { cn } from "@/lib/utils";
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

function ListaNotificacoes({
  notificacoes,
  abrir,
  fechar,
  className,
}: {
  notificacoes: Notificacao[];
  abrir: (n: Notificacao) => void;
  fechar: () => void;
  className?: string;
}) {
  return (
    <>
      <div className={cn("divide-y divide-border", className)}>
        {notificacoes.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            Nenhuma notificação por aqui.
          </p>
        )}
        {notificacoes.map((n) => (
          <button
            key={n.id}
            onClick={() => abrir(n)}
            className={cn(
              "flex w-full min-w-0 flex-col gap-0.5 px-2 py-2.5 text-left text-sm hover:bg-muted",
              !n.lida && "bg-primary/5"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className={cn("break-words", n.lida ? "font-medium" : "font-semibold")}>
                {n.titulo}
              </span>
              {!n.lida && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-red-600" />}
            </div>
            <p className="text-xs break-words text-muted-foreground">{n.mensagem}</p>
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
        onClick={fechar}
        render={<Link href="/notificacoes" />}
        nativeButton={false}
      >
        Ver todas
      </Button>
    </>
  );
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

  const sino = (
    <Button variant="ghost" size="icon" className="relative size-8">
      <Bell className="size-4" />
      {contagemNaoLida > 0 && (
        <Badge className="absolute -top-1 -right-1 size-4 justify-center rounded-full p-0 text-[10px] bg-red-600 text-white dark:bg-red-600">
          {contagemNaoLida > 9 ? "9+" : contagemNaoLida}
        </Badge>
      )}
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={sino} />
      <PopoverContent
        align="end"
        className="w-[min(20rem,calc(100vw-2rem))] border border-border p-0 shadow-lg"
      >
        <PopoverHeader className="gap-1.5 px-3 pt-3">
          <div className="flex items-center justify-between gap-2">
            <PopoverTitle>Notificações</PopoverTitle>
            <PushToggle />
          </div>
          {contagemNaoLida > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto self-end px-1.5 text-xs"
              onClick={marcarTudo}
              disabled={isPending}
            >
              Marcar todas como lidas
            </Button>
          )}
        </PopoverHeader>
        <ListaNotificacoes
          notificacoes={notificacoes}
          abrir={abrir}
          fechar={() => setOpen(false)}
          className="max-h-80 overflow-y-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
