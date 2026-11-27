"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { alterarTipoNotificacaoAtivo } from "@/lib/actions/notificacoes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { TipoNotificacao } from "@/lib/constants";

type TipoConfig = { tipo: TipoNotificacao; label: string; ativo: boolean };

const GRUPOS: { titulo: string; tipos: TipoNotificacao[] }[] = [
  {
    titulo: "Vagas",
    tipos: [
      "vaga_pendente_aprovacao",
      "vaga_aprovada",
      "vaga_rejeitada",
      "vaga_fechada",
      "vaga_cancelada",
    ],
  },
  {
    titulo: "Prazos e SLA",
    tipos: [
      "vaga_sla_vencendo",
      "vaga_sla_atrasada",
      "experiencia_1_vencendo",
      "experiencia_2_vencendo",
    ],
  },
];

export function NotificacaoTiposCard({ tipos }: { tipos: TipoConfig[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tiposOtimistas, setTipoOtimista] = useOptimistic(
    tipos,
    (state, { tipo, ativo }: { tipo: TipoNotificacao; ativo: boolean }) =>
      state.map((item) => (item.tipo === tipo ? { ...item, ativo } : item))
  );

  function handleChange(tipo: TipoNotificacao, ativo: boolean) {
    startTransition(async () => {
      setTipoOtimista({ tipo, ativo });
      const result = await alterarTipoNotificacaoAtivo(tipo, ativo);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(ativo ? "Notificação ativada" : "Notificação desativada");
      router.refresh();
    });
  }

  const porTipo = new Map(tiposOtimistas.map((item) => [item.tipo, item]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipos de notificação</CardTitle>
        <CardDescription>
          Ative ou desative, para todo o sistema, quais eventos geram notificação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2">
          {GRUPOS.map((grupo) => (
            <div key={grupo.titulo} className="flex flex-col gap-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {grupo.titulo}
              </h3>
              <ul className="flex flex-col gap-3">
                {grupo.tipos.flatMap((tipo) => {
                  const item = porTipo.get(tipo);
                  if (!item) return [];
                  return (
                    <li key={tipo} className="flex items-center justify-between gap-3 text-sm">
                      <span>{item.label}</span>
                      <Switch
                        checked={item.ativo}
                        onCheckedChange={(ativo) => handleChange(tipo, ativo)}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
