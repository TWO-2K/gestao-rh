"use client";

import { useState } from "react";
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
import type { Database, SituacaoVaga } from "@/types/database";

type VagaDetalhada = Database["public"]["Views"]["vagas_detalhada"]["Row"];
type Opcao = { id: string; nome: string };
type Mode = "view" | "edit";

const COLUNAS: { situacao: SituacaoVaga; titulo: string }[] = [
  { situacao: "pendente_aprovacao", titulo: "Pendente de aprovação" },
  { situacao: "em_aberto", titulo: "Em aberto" },
  { situacao: "fechado", titulo: "Fechado" },
  { situacao: "cancelado", titulo: "Cancelado" },
];

function formatarData(data: string | null) {
  if (!data) return "—";
  return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
}

export function VagasKanban({
  vagas,
  unidades,
  cargos,
  setores,
  funcionarios,
  cargoSetorMap,
  isAdmin = false,
  somenteLeitura = false,
}: {
  vagas: VagaDetalhada[];
  unidades: Opcao[];
  cargos: Opcao[];
  setores: Opcao[];
  funcionarios: Opcao[];
  cargoSetorMap: Record<string, string[]>;
  isAdmin?: boolean;
  somenteLeitura?: boolean;
}) {
  const [vagaSelecionada, setVagaSelecionada] = useState<VagaDetalhada | null>(null);
  const [modo, setModo] = useState<Mode>("view");
  const [sheetAberto, setSheetAberto] = useState(false);

  function abrir(vaga: VagaDetalhada) {
    setVagaSelecionada(vaga);
    setModo("view");
    setSheetAberto(true);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {COLUNAS.map((coluna) => {
        const vagasDaColuna = vagas.filter((v) => v.situacao === coluna.situacao);
        return (
          <div key={coluna.situacao} className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold">{coluna.titulo}</h2>
              <Badge variant="outline">{vagasDaColuna.length}</Badge>
            </div>

            <div className="flex flex-col gap-3">
              {vagasDaColuna.length === 0 && (
                <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                  Nenhuma vaga
                </div>
              )}

              {vagasDaColuna.map((vaga) => (
                <Card
                  key={vaga.id}
                  className="cursor-pointer gap-3 py-4"
                  onClick={() => abrir(vaga)}
                >
                  <CardHeader className="px-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">
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
                        variant="buttons"
                        isAdmin={isAdmin}
                        somenteLeitura={somenteLeitura}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      <VagaSheet
        vaga={vagaSelecionada}
        mode={modo}
        unidades={unidades}
        cargos={cargos}
        setores={setores}
        funcionarios={funcionarios}
        cargoSetorMap={cargoSetorMap}
        open={sheetAberto}
        onOpenChange={setSheetAberto}
        somenteLeitura={somenteLeitura}
      />
    </div>
  );
}
