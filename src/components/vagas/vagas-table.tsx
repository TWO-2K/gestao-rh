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
import { VagaSheet } from "./vaga-sheet";
import { SolicitarVagaSheet } from "./solicitar-vaga-sheet";
import { AlertaExperiencia, AvisoAdmissaoFaltante, periodoExperienciaAtivo } from "./alerta-experiencia";
import type { Database } from "@/types/database";

type VagaDetalhada = Database["public"]["Views"]["vagas_detalhada"]["Row"];
type Opcao = { id: string; nome: string };
type FuncionarioOpcao = {
  id: string;
  nome: string;
  unidade_id: string | null;
  eh_gestor: boolean;
};
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
  somenteLeitura = false,
  isGestor = false,
  isAdmin = false,
  currentUserId,
}: {
  vagas: VagaDetalhada[];
  unidades: Opcao[];
  cargos: Opcao[];
  setores: Opcao[];
  funcionarios: FuncionarioOpcao[];
  cargoSetorMap: Record<string, string[]>;
  somenteLeitura?: boolean;
  isGestor?: boolean;
  isAdmin?: boolean;
  currentUserId?: string;
}) {
  const [vagaSelecionada, setVagaSelecionada] = useState<VagaDetalhada | null>(null);
  const [modo, setModo] = useState<Mode>("view");
  const [sheetAberto, setSheetAberto] = useState(false);
  const [vagaParaEditar, setVagaParaEditar] = useState<VagaDetalhada | null>(null);
  const [editarAberto, setEditarAberto] = useState(false);

  function abrir(vaga: VagaDetalhada, mode: Mode) {
    setVagaSelecionada(vaga);
    setModo(somenteLeitura ? "view" : mode);
    setSheetAberto(true);
  }

  function abrirEdicaoGestor(vaga: VagaDetalhada) {
    setVagaParaEditar(vaga);
    setEditarAberto(true);
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
            {!isGestor && (
              <>
                <TableHead>Experiência</TableHead>
                <TableHead>Candidato(a)</TableHead>
                <TableHead>Recrutador</TableHead>
              </>
            )}
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
              {!isGestor && (
                <>
                  <TableCell>
                    {vaga.situacao === "fechado" && !vaga.data_admissao ? (
                      <AvisoAdmissaoFaltante />
                    ) : (
                      vaga.situacao !== "cancelado" && (
                        <AlertaExperiencia {...periodoExperienciaAtivo(vaga)} />
                      )
                    )}
                  </TableCell>
                  <TableCell>{vaga.candidato_aprovado ?? "—"}</TableCell>
                  <TableCell>{vaga.recrutador_nome ?? "—"}</TableCell>
                </>
              )}
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
        somenteLeitura={somenteLeitura}
        currentUserId={currentUserId}
        onEditarSolicitacao={
          isGestor && vagaSelecionada
            ? () => {
                setSheetAberto(false);
                abrirEdicaoGestor(vagaSelecionada);
              }
            : undefined
        }
      />
      {isGestor && (
        <SolicitarVagaSheet
          cargos={cargos}
          setores={setores}
          cargoSetorMap={cargoSetorMap}
          vagaId={vagaParaEditar?.id}
          defaultValues={
            vagaParaEditar
              ? {
                  cargo_id: vagaParaEditar.cargo_id,
                  setor_id: vagaParaEditar.setor_id,
                  motivo: vagaParaEditar.motivo,
                  horario_trabalho: vagaParaEditar.horario_trabalho ?? "",
                  justificativa: vagaParaEditar.justificativa ?? "",
                }
              : undefined
          }
          open={editarAberto}
          onOpenChange={setEditarAberto}
        />
      )}
    </div>
  );
}
