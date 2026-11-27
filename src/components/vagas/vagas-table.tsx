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
  horariosTrabalho,
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
  horariosTrabalho: Opcao[];
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
    <div className="overflow-x-auto rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nº</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead className="hidden lg:table-cell">Setor</TableHead>
            {!isGestor && <TableHead>Recrutador</TableHead>}
            <TableHead>Motivo</TableHead>
            <TableHead className="hidden md:table-cell">Abertura</TableHead>
            <TableHead className="hidden md:table-cell">Previsão</TableHead>
            <TableHead className="hidden md:table-cell">Dias em aberto</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead className="hidden md:table-cell">SLA</TableHead>
            {!isGestor && (
              <>
                <TableHead className="hidden lg:table-cell">Experiência</TableHead>
                <TableHead>Candidato(a)</TableHead>
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
              <TableCell>
                <span className="block max-w-[180px] truncate" title={vaga.cargo_nome}>
                  {vaga.cargo_nome}
                </span>
              </TableCell>
              <TableCell className="hidden lg:table-cell">{vaga.setor_nome}</TableCell>
              {!isGestor && <TableCell>{vaga.recrutador_nome ?? "—"}</TableCell>}
              <TableCell>{MOTIVO_VAGA_LABEL[vaga.motivo]}</TableCell>
              <TableCell className="hidden md:table-cell">{formatarData(vaga.data_abertura)}</TableCell>
              <TableCell className="hidden md:table-cell">{formatarData(vaga.previsao_fechamento)}</TableCell>
              <TableCell className="hidden md:table-cell">
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
              <TableCell className="hidden md:table-cell">
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
                  <TableCell className="hidden lg:table-cell">
                    {vaga.situacao === "fechado" && !vaga.data_admissao ? (
                      <AvisoAdmissaoFaltante />
                    ) : (
                      vaga.situacao !== "cancelado" && (
                        <AlertaExperiencia {...periodoExperienciaAtivo(vaga)} />
                      )
                    )}
                  </TableCell>
                  <TableCell>{vaga.candidato_aprovado ?? "—"}</TableCell>
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
        horariosTrabalho={horariosTrabalho}
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
          horariosTrabalho={horariosTrabalho}
          cargoSetorMap={cargoSetorMap}
          vagaId={vagaParaEditar?.id}
          defaultValues={
            vagaParaEditar
              ? {
                  cargo_id: vagaParaEditar.cargo_id,
                  setor_id: vagaParaEditar.setor_id,
                  motivo: vagaParaEditar.motivo,
                  horario_trabalho_id: vagaParaEditar.horario_trabalho_id ?? "",
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
