"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { marcarComoLida } from "@/lib/actions/notificacoes";
import { TIPO_NOTIFICACAO_LABEL } from "@/lib/constants";
import type { Tables } from "@/types/database";

type Notificacao = Pick<
  Tables<"notificacoes">,
  "id" | "tipo" | "titulo" | "mensagem" | "vaga_id" | "lida" | "lida_em" | "created_at"
>;

function formatarDataHora(data: string) {
  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificacoesLista({ notificacoes }: { notificacoes: Notificacao[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function marcar(id: string) {
    startTransition(async () => {
      await marcarComoLida(id);
      router.refresh();
    });
  }

  if (notificacoes.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhuma notificação encontrada.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {notificacoes.map((n) => (
        <Card key={n.id} className={n.lida ? "opacity-70" : undefined}>
          <CardContent className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{n.titulo}</span>
                {!n.lida && <Badge className="bg-red-600 text-white dark:bg-red-600">Nova</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{n.mensagem}</p>
              <span className="text-xs text-muted-foreground">
                {TIPO_NOTIFICACAO_LABEL[n.tipo] ?? n.tipo} · {formatarDataHora(n.created_at)}
              </span>
            </div>
            {!n.lida && (
              <Button variant="outline" size="sm" onClick={() => marcar(n.id)} disabled={isPending}>
                Marcar como lida
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
