"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MOTIVO_VAGA_LABEL,
  SITUACAO_BADGE_VARIANT,
  SITUACAO_VAGA_LABEL,
  STATUS_SLA_BADGE_VARIANT,
  STATUS_SLA_LABEL,
} from "@/lib/constants";
import { VagaRowActions } from "./vaga-row-actions";
import { VagaSheet } from "./vaga-sheet";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import type { Database } from "@/types/database";

type VagaDetalhada = Database["public"]["Views"]["vagas_detalhada"]["Row"];
type Opcao = { id: string; nome: string };
type Mode = "view" | "edit";

function formatarData(data: string | null) {
  if (!data) return "—";
  return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
}

export function VagasTable({
  vagas,
  unidades,
  cargos,
  setores,
  funcionarios,
  cargoSetorMap,
}: {
  vagas: VagaDetalhada[];
  unidades: Opcao[];
  cargos: Opcao[];
  setores: Opcao[];
  funcionarios: Opcao[];
  cargoSetorMap: Record<string, string[]>;
}) {
  const [vagaSelecionada, setVagaSelecionada] = useState<VagaDetalhada | null>(null);
  const [modo, setModo] = useState<Mode>("view");
  const [sheetAberto, setSheetAberto] = useState(false);

  function abrir(vaga: VagaDetalhada, mode: Mode) {
    setVagaSelecionada(vaga);
    setModo(mode);
    setSheetAberto(true);
  }

  if (vagas.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
        Nenhuma vaga encontrada com os filtros atuais.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nº</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Abertura</TableHead>
            <TableHead>Previsão</TableHead>
            <TableHead>Dias em aberto</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Candidato(a)</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {vagas.map((vaga) => (
            <TableRow
              key={vaga.id}
              className="cursor-pointer"
              onClick={() => abrir(vaga, "view")}
            >
              <TableCell className="font-medium">{vaga.numero}</TableCell>
              <TableCell>{vaga.unidade_nome}</TableCell>
              <TableCell>{vaga.cargo_nome}</TableCell>
              <TableCell>{vaga.setor_nome}</TableCell>
              <TableCell>{MOTIVO_VAGA_LABEL[vaga.motivo]}</TableCell>
              <TableCell>{formatarData(vaga.data_abertura)}</TableCell>
              <TableCell>{formatarData(vaga.previsao_fechamento)}</TableCell>
              <TableCell>
                {vaga.dias_em_aberto === null ? "—" : `${vaga.dias_em_aberto} dias`}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("border", SITUACAO_BADGE_VARIANT[vaga.situacao])}
                >
                  {SITUACAO_VAGA_LABEL[vaga.situacao]}
                </Badge>
              </TableCell>
              <TableCell>
                {vaga.status_sla && (
                  <Badge
                    variant="outline"
                    className={cn("border", STATUS_SLA_BADGE_VARIANT[vaga.status_sla])}
                  >
                    {STATUS_SLA_LABEL[vaga.status_sla]}
                  </Badge>
                )}
              </TableCell>
              <TableCell>{vaga.candidato_aprovado ?? "—"}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => abrir(vaga, "edit")}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <VagaRowActions
                    vagaId={vaga.id}
                    situacao={vaga.situacao}
                    suspensa={vaga.suspensa}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
      />
    </div>
  );
}
