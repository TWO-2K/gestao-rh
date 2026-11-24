import { MOTIVO_VAGA_LABEL, SITUACAO_VAGA_LABEL } from "@/lib/constants";

export const TEMPLATE_COLUNAS = [
  { chave: "cargo", titulo: "Cargo", obrigatorio: true },
  { chave: "setor", titulo: "Setor (se o cargo tiver mais de um)", obrigatorio: false },
  { chave: "motivo", titulo: "Motivo (Substituição ou Aumento de Quadro)", obrigatorio: true },
  { chave: "horario_trabalho", titulo: "Horário de trabalho", obrigatorio: false },
  { chave: "gestor_solicitante", titulo: "Gestor solicitante", obrigatorio: false },
  { chave: "data_abertura", titulo: "Data de abertura (dd/mm/aaaa)", obrigatorio: true },
  { chave: "sla_dias", titulo: "SLA (dias)", obrigatorio: true },
  { chave: "numero_senior", titulo: "Nº no sistema Senior", obrigatorio: false },
  { chave: "justificativa", titulo: "Justificativa", obrigatorio: false },
  { chave: "situacao", titulo: "Situação (Em aberto, Fechado ou Cancelado)", obrigatorio: false },
  { chave: "candidato_aprovado", titulo: "Candidato(a) aprovado(a)", obrigatorio: false },
  { chave: "data_fechamento", titulo: "Data de fechamento (dd/mm/aaaa)", obrigatorio: false },
  { chave: "data_admissao", titulo: "Data de admissão (dd/mm/aaaa)", obrigatorio: false },
  { chave: "observacoes", titulo: "Observações", obrigatorio: false },
] as const;

export const TEMPLATE_LINHA_EXEMPLO: Record<string, string> = {
  cargo: "Operador(a) de Caixa",
  setor: "",
  motivo: "Substituição",
  horario_trabalho: "08h às 17h",
  gestor_solicitante: "Maria Silva",
  data_abertura: "01/11/2026",
  sla_dias: "20",
  numero_senior: "",
  justificativa: "Substituição de colaborador(a) desligado(a)",
  situacao: "Em aberto",
  candidato_aprovado: "",
  data_fechamento: "",
  data_admissao: "",
  observacoes: "",
};

export type LinhaBruta = Record<string, unknown>;

export type LinhaValidada = {
  linha: number;
  original: LinhaBruta;
  erros: string[];
  dados: {
    cargo_id: string;
    setor_id: string;
    motivo: "substituicao" | "aumento_de_quadro";
    horario_trabalho: string | null;
    gestor_id: string | null;
    data_abertura: string;
    sla_dias: number;
    numero_senior: string | null;
    justificativa: string | null;
    situacao: "em_aberto" | "fechado" | "cancelado";
    candidato_aprovado: string | null;
    data_fechamento: string | null;
    data_admissao: string | null;
    observacoes: string | null;
  } | null;
};

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function texto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  const s = String(valor).trim();
  return s === "" ? null : s;
}

const EPOCH_EXCEL = Date.UTC(1899, 11, 30);

export function parseData(valor: unknown): string | null {
  if (valor === null || valor === undefined || valor === "") return null;

  if (valor instanceof Date) {
    return valor.toISOString().slice(0, 10);
  }

  if (typeof valor === "number") {
    const ms = EPOCH_EXCEL + valor * 86400000;
    return new Date(ms).toISOString().slice(0, 10);
  }

  const s = String(valor).trim();
  const match = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (match) {
    const [, d, m, a] = match;
    const ano = a.length === 2 ? `20${a}` : a;
    return `${ano}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0].slice(0, 10);

  return null;
}

function parseMotivo(valor: unknown): "substituicao" | "aumento_de_quadro" | null {
  const s = texto(valor);
  if (!s) return null;
  const n = normalizar(s);
  for (const [chave, label] of Object.entries(MOTIVO_VAGA_LABEL)) {
    if (normalizar(label) === n || chave === n) return chave as "substituicao" | "aumento_de_quadro";
  }
  if (n.includes("substitui")) return "substituicao";
  if (n.includes("aumento")) return "aumento_de_quadro";
  return null;
}

function parseSituacao(valor: unknown): "em_aberto" | "fechado" | "cancelado" | null {
  const s = texto(valor);
  if (!s) return "em_aberto";
  const n = normalizar(s);
  for (const [chave, label] of Object.entries(SITUACAO_VAGA_LABEL)) {
    if (normalizar(label) === n || chave === n) return chave as "em_aberto" | "fechado" | "cancelado";
  }
  return null;
}

export function validarLinha(
  linha: number,
  original: LinhaBruta,
  contexto: {
    cargosPorNome: Map<string, { id: string; nome: string }>;
    setoresPorNome: Map<string, { id: string; nome: string }>;
    funcionariosPorNome: Map<string, { id: string; nome: string }>;
    cargoSetorMap: Record<string, string[]>;
  }
): LinhaValidada {
  const erros: string[] = [];

  const cargoNome = texto(original.cargo);
  const cargo = cargoNome ? contexto.cargosPorNome.get(normalizar(cargoNome)) : null;
  if (!cargoNome) erros.push("Cargo é obrigatório");
  else if (!cargo) erros.push(`Cargo "${cargoNome}" não encontrado no catálogo`);

  let setorId: string | null = null;
  const setorNome = texto(original.setor);
  if (cargo) {
    const setoresDoCargo = contexto.cargoSetorMap[cargo.id] ?? [];
    if (setorNome) {
      const setor = contexto.setoresPorNome.get(normalizar(setorNome));
      if (!setor) erros.push(`Setor "${setorNome}" não encontrado`);
      else setorId = setor.id;
    } else if (setoresDoCargo.length === 1) {
      setorId = setoresDoCargo[0];
    } else if (setoresDoCargo.length > 1) {
      erros.push("Cargo tem mais de um setor possível — informe a coluna Setor");
    } else {
      erros.push("Cargo não está vinculado a nenhum setor");
    }
  }

  const motivo = parseMotivo(original.motivo);
  if (!motivo) erros.push('Motivo inválido (use "Substituição" ou "Aumento de Quadro")');

  const dataAbertura = parseData(original.data_abertura);
  if (!dataAbertura) erros.push("Data de abertura inválida ou ausente");

  const slaTexto = texto(original.sla_dias);
  const sla = slaTexto ? Number(slaTexto) : NaN;
  if (!slaTexto || Number.isNaN(sla) || sla <= 0) erros.push("SLA (dias) inválido");

  const situacao = parseSituacao(original.situacao);
  if (situacao === null) erros.push('Situação inválida (use "Em aberto", "Fechado" ou "Cancelado")');

  let gestorId: string | null = null;
  const gestorNome = texto(original.gestor_solicitante);
  if (gestorNome) {
    const gestor = contexto.funcionariosPorNome.get(normalizar(gestorNome));
    if (!gestor) erros.push(`Gestor "${gestorNome}" não encontrado`);
    else gestorId = gestor.id;
  }

  const dataFechamento = parseData(original.data_fechamento);
  if (texto(original.data_fechamento) && !dataFechamento) {
    erros.push("Data de fechamento inválida");
  }
  const dataAdmissao = parseData(original.data_admissao);
  if (texto(original.data_admissao) && !dataAdmissao) {
    erros.push("Data de admissão inválida");
  }
  if (dataAdmissao && dataAbertura && dataAdmissao < dataAbertura) {
    erros.push("Data de admissão não pode ser anterior à abertura");
  }

  if (erros.length > 0) {
    return { linha, original, erros, dados: null };
  }

  return {
    linha,
    original,
    erros,
    dados: {
      cargo_id: cargo!.id,
      setor_id: setorId!,
      motivo: motivo!,
      horario_trabalho: texto(original.horario_trabalho),
      gestor_id: gestorId,
      data_abertura: dataAbertura!,
      sla_dias: sla,
      numero_senior: texto(original.numero_senior),
      justificativa: texto(original.justificativa),
      situacao: situacao!,
      candidato_aprovado: texto(original.candidato_aprovado),
      data_fechamento: dataFechamento,
      data_admissao: dataAdmissao,
      observacoes: texto(original.observacoes),
    },
  };
}
