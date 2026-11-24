"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MOTIVO_VAGA_LABEL,
  SITUACAO_VAGA_LABEL,
  STATUS_SLA_LABEL,
} from "@/lib/constants";
import { buscarVagasParaExportar } from "@/lib/actions/vagas";
import type { VagasFiltro } from "@/lib/data/vagas";
import type { Database } from "@/types/database";

type VagaDetalhada = Database["public"]["Views"]["vagas_detalhada"]["Row"];

function formatarData(data: string | null) {
  if (!data) return "";
  return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
}

function linhasPlanas(vagas: VagaDetalhada[]) {
  return vagas.map((v) => ({
    "Nº": v.numero,
    "Nº Senior": v.numero_senior ?? "",
    Unidade: v.unidade_nome,
    Cargo: v.cargo_nome,
    Setor: v.setor_nome,
    Motivo: MOTIVO_VAGA_LABEL[v.motivo] ?? v.motivo,
    "Gestor solicitante": v.gestor_nome ?? "",
    "Data de abertura": formatarData(v.data_abertura),
    "SLA (dias)": v.sla_dias,
    "Previsão de fechamento": formatarData(v.previsao_fechamento),
    "Dias em aberto": v.dias_em_aberto ?? "",
    Situação: SITUACAO_VAGA_LABEL[v.situacao] ?? v.situacao,
    "Status SLA": v.status_sla ? STATUS_SLA_LABEL[v.status_sla] ?? v.status_sla : "",
    Suspensa: v.suspensa ? "Sim" : "Não",
    "Candidato(a) aprovado(a)": v.candidato_aprovado ?? "",
    "Data de fechamento": formatarData(v.data_fechamento),
    "Data de admissão": formatarData(v.data_admissao),
    Recrutador: v.recrutador_nome ?? "",
    Observações: v.observacoes ?? "",
  }));
}

function exportarExcel(vagas: VagaDetalhada[]) {
  const planilha = XLSX.utils.json_to_sheet(linhasPlanas(vagas));
  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, planilha, "Vagas");
  const data = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(livro, `vagas-${data}.xlsx`);
}

function exportarPdf(vagas: VagaDetalhada[]) {
  const linhas = linhasPlanas(vagas);
  const colunas = linhas.length > 0 ? Object.keys(linhas[0]) : [];

  const janela = window.open("", "_blank");
  if (!janela) return;

  const linhasHtml = linhas
    .map(
      (linha) =>
        `<tr>${colunas.map((c) => `<td>${String(linha[c as keyof typeof linha] ?? "")}</td>`).join("")}</tr>`
    )
    .join("");

  janela.document.write(`
    <html>
      <head>
        <title>Mapa de Vagas</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          h1 { font-size: 16px; margin-bottom: 4px; }
          p { font-size: 11px; color: #555; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; font-size: 9px; }
          th, td { border: 1px solid #ccc; padding: 3px 5px; text-align: left; white-space: nowrap; }
          th { background: #f3f3f3; }
        </style>
      </head>
      <body>
        <h1>Mapa de Vagas — Grupo +B</h1>
        <p>Exportado em ${new Date().toLocaleString("pt-BR")} · ${linhas.length} vaga${linhas.length === 1 ? "" : "s"}</p>
        <table>
          <thead><tr>${colunas.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
          <tbody>${linhasHtml}</tbody>
        </table>
      </body>
    </html>
  `);
  janela.document.close();
  janela.focus();
  janela.print();
}

export function ExportarVagas({
  vagas,
  filtro,
}: {
  vagas?: VagaDetalhada[];
  filtro?: VagasFiltro;
}) {
  const [carregando, setCarregando] = useState(false);

  async function obterVagas(): Promise<VagaDetalhada[] | null> {
    if (vagas) return vagas;
    if (!filtro) return [];
    setCarregando(true);
    try {
      return await buscarVagasParaExportar(filtro);
    } catch {
      toast.error("Não foi possível buscar as vagas para exportação");
      return null;
    } finally {
      setCarregando(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" disabled={carregando}>
            <Download className="size-4" />
            Exportar
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={async () => {
            const lista = await obterVagas();
            if (lista) exportarExcel(lista);
          }}
        >
          <Download className="size-4" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            const lista = await obterVagas();
            if (lista) exportarPdf(lista);
          }}
        >
          <Printer className="size-4" />
          PDF (imprimir)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
