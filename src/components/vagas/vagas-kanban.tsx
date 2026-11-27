"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  MOTIVO_VAGA_LABEL,
  STATUS_SLA_BADGE_VARIANT,
  STATUS_SLA_LABEL,
} from "@/lib/constants";
import { VagaRowActions } from "./vaga-row-actions";
import { VagaSheet } from "./vaga-sheet";
import { AlertaExperiencia, AvisoAdmissaoFaltante, periodoExperienciaAtivo } from "./alerta-experiencia";
import type { Database, SituacaoVaga } from "@/types/database";

type VagaDetalhada = Database["public"]["Views"]["vagas_detalhada"]["Row"];
type Opcao = { id: string; nome: string };
type FuncionarioOpcao = {
  id: string;
  nome: string;
  unidade_id: string | null;
  eh_gestor: boolean;
};
type Mode = "view" | "edit";

const COLUNAS: { situacao: SituacaoVaga; titulo: string }[] = [
  { situacao: "pendente_aprovacao", titulo: "Pendente de aprovação" },
  { situacao: "em_aberto", titulo: "Em aberto" },
  { situacao: "fechado", titulo: "Fechado" },
  { situacao: "cancelado", titulo: "Cancelado" },
  { situacao: "rejeitado", titulo: "Rejeitado" },
];

const COLUNA_COR: Record<SituacaoVaga, string> = {
  pendente_aprovacao: "bg-amber-500",
  em_aberto: "bg-emerald-600",
  fechado: "bg-slate-500",
  cancelado: "bg-red-600",
  rejeitado: "bg-rose-800",
};

function formatarData(data: string | null) {
  if (!data) return "—";
  return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
}

function dataReferencia(vaga: VagaDetalhada) {
  return vaga.data_fechamento ?? vaga.data_cancelamento ?? vaga.data_abertura;
}

export function VagasKanban({
  vagas,
  unidades,
  cargos,
  setores,
  horariosTrabalho,
  funcionarios,
  cargoSetorMap,
  isAdmin = false,
  somenteLeitura = false,
  currentUserId,
}: {
  vagas: VagaDetalhada[];
  unidades: Opcao[];
  cargos: Opcao[];
  setores: Opcao[];
  horariosTrabalho: Opcao[];
  funcionarios: FuncionarioOpcao[];
  cargoSetorMap: Record<string, string[]>;
  isAdmin?: boolean;
  somenteLeitura?: boolean;
  currentUserId?: string;
}) {
  const [vagaSelecionada, setVagaSelecionada] = useState<VagaDetalhada | null>(null);
  const [modo, setModo] = useState<Mode>("view");
  const [sheetAberto, setSheetAberto] = useState(false);
  const [colunaAtiva, setColunaAtiva] = useState<SituacaoVaga>("em_aberto");

  function abrir(vaga: VagaDetalhada) {
    setVagaSelecionada(vaga);
    setModo("view");
    setSheetAberto(true);
  }

  const vagasPorColuna = COLUNAS.reduce(
    (acc, coluna) => {
      const fechadaOuCancelada =
        coluna.situacao === "fechado" ||
        coluna.situacao === "cancelado" ||
        coluna.situacao === "rejeitado";
      acc[coluna.situacao] = vagas
        .filter((v) => v.situacao === coluna.situacao)
        .sort((a, b) =>
          fechadaOuCancelada ? dataReferencia(b).localeCompare(dataReferencia(a)) : 0,
        );
      return acc;
    },
    {} as Record<SituacaoVaga, VagaDetalhada[]>,
  );

  return (
    <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      <div className="scrollbar-hidden flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {COLUNAS.map((coluna) => (
          <button
            key={coluna.situacao}
            type="button"
            onClick={(e) => {
              setColunaAtiva(coluna.situacao);
              e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
            }}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
              colunaAtiva === coluna.situacao
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            <span className={cn("size-2 shrink-0 rounded-full", COLUNA_COR[coluna.situacao])} />
            {coluna.titulo}
            <Badge
              className={cn(
                "h-4 min-w-4 justify-center px-1 text-[10px]",
                colunaAtiva === coluna.situacao
                  ? "bg-background text-foreground"
                  : "bg-foreground text-background",
              )}
            >
              {vagasPorColuna[coluna.situacao].length}
            </Badge>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:h-full lg:min-h-0 lg:grid-cols-5">
        {COLUNAS.map((coluna) => {
        const fechadaOuCancelada =
          coluna.situacao === "fechado" ||
          coluna.situacao === "cancelado" ||
          coluna.situacao === "rejeitado";
        const vagasDaColuna = vagasPorColuna[coluna.situacao];
        return (
          <div
            key={coluna.situacao}
            className={cn(
              "flex-col gap-3 lg:flex lg:h-full lg:min-h-0",
              colunaAtiva === coluna.situacao ? "flex" : "hidden lg:flex",
            )}
          >
            <div className="flex flex-col gap-2 shrink-0">
              <div className={cn("h-1.5 w-full rounded-full", COLUNA_COR[coluna.situacao])} />
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", COLUNA_COR[coluna.situacao])} />
                  <h2 className="text-xs font-bold tracking-wide uppercase">{coluna.titulo}</h2>
                </div>
                <Badge className="bg-foreground text-background">{vagasDaColuna.length}</Badge>
              </div>
            </div>

            <div className="scrollbar-hidden flex flex-col gap-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
              {vagasDaColuna.length === 0 && (
                <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                  Nenhuma vaga
                </div>
              )}

              {vagasDaColuna.map((vaga) =>
                fechadaOuCancelada ? (
                  <Card
                    key={vaga.id}
                    className="shrink-0 cursor-pointer gap-3 py-4"
                    onClick={() => abrir(vaga)}
                  >
                    <CardContent className="flex flex-col gap-1.5 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span
                            className="truncate text-sm font-semibold"
                            title={`#${vaga.numero} · ${vaga.cargo_nome}`}
                          >
                            #{vaga.numero} · {vaga.cargo_nome}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {vaga.unidade_nome} · {formatarData(dataReferencia(vaga))}
                          </p>
                        </div>
                        {vaga.situacao === "fechado" ? (
                          <Badge className="w-fit shrink-0 gap-1 bg-emerald-600 text-white dark:bg-emerald-600">
                            <CheckCircle2 className="size-3.5" />
                            Fechada
                          </Badge>
                        ) : vaga.situacao === "rejeitado" ? (
                          <Badge className="w-fit shrink-0 gap-1 bg-rose-800 text-white dark:bg-rose-800">
                            <XCircle className="size-3.5" />
                            Rejeitada
                          </Badge>
                        ) : (
                          <Badge className="w-fit shrink-0 gap-1 bg-red-600 text-white dark:bg-red-600">
                            <XCircle className="size-3.5" />
                            Cancelada
                          </Badge>
                        )}
                      </div>
                      {vaga.situacao === "fechado" && vaga.candidato_aprovado && (
                        <p className="truncate text-xs">
                          Contratado(a): <span className="font-medium">{vaga.candidato_aprovado}</span>
                        </p>
                      )}
                      {vaga.situacao === "fechado" && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted-foreground">Experiência:</span>
                          {vaga.data_admissao ? (
                            <AlertaExperiencia {...periodoExperienciaAtivo(vaga)} />
                          ) : (
                            <AvisoAdmissaoFaltante />
                          )}
                        </div>
                      )}
                      {(vaga.situacao === "cancelado" || vaga.situacao === "rejeitado") &&
                        vaga.observacoes && (
                          <p className="truncate text-xs text-muted-foreground">{vaga.observacoes}</p>
                        )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card
                    key={vaga.id}
                    className="shrink-0 cursor-pointer gap-3 py-4"
                    onClick={() => abrir(vaga)}
                  >
                    <CardHeader className="min-w-0 px-4">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <span
                          className="min-w-0 truncate text-sm font-semibold"
                          title={`#${vaga.numero} · ${vaga.cargo_nome}`}
                        >
                          #{vaga.numero} · {vaga.cargo_nome}
                        </span>
                        {vaga.status_sla && (
                          <Badge
                            variant="outline"
                            className={cn("border text-xs", STATUS_SLA_BADGE_VARIANT[vaga.status_sla])}
                          >
                            {STATUS_SLA_LABEL[vaga.status_sla]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{vaga.unidade_nome}</p>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 px-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{MOTIVO_VAGA_LABEL[vaga.motivo]}</span>
                        <span>·</span>
                        <span>Abertura {formatarData(vaga.data_abertura)}</span>
                        {vaga.dias_em_aberto !== null && (
                          <>
                            <span>·</span>
                            <span>{vaga.dias_em_aberto} dias</span>
                          </>
                        )}
                      </div>
                      {vaga.candidato_aprovado && (
                        <p className="text-xs">
                          Candidato(a): <span className="font-medium">{vaga.candidato_aprovado}</span>
                        </p>
                      )}
                      <div onClick={(e) => e.stopPropagation()}>
                        <VagaRowActions
                          vagaId={vaga.id}
                          situacao={vaga.situacao}
                          suspensa={vaga.suspensa}
                          variant="card"
                          isAdmin={isAdmin}
                          somenteLeitura={somenteLeitura}
                          recrutadorId={vaga.recrutador_id}
                          recrutadorNome={vaga.recrutador_nome}
                          currentUserId={currentUserId}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ),
              )}
            </div>
          </div>
        );
        })}
      </div>

      <VagaSheet
        vaga={vagaSelecionada}
        mode={modo}
        unidades={unidades}
        cargos={cargos}
        setores={setores}
        horariosTrabalho={horariosTrabalho}
        funcionarios={funcionarios}
        cargoSetorMap={cargoSetorMap}
        open={sheetAberto}
        onOpenChange={setSheetAberto}
        somenteLeitura={somenteLeitura}
        currentUserId={currentUserId}
      />
    </div>
  );
}
