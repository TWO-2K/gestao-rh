"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCargos, getCargoSetorMap, getFuncionarios, getSetores } from "@/lib/data/lookups";
import { validarLinha, type LinhaBruta, type LinhaValidada } from "@/lib/import/vagas";

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

async function montarContexto() {
  const [cargos, setores, funcionarios, cargoSetorMap] = await Promise.all([
    getCargos(),
    getSetores(),
    getFuncionarios(),
    getCargoSetorMap(),
  ]);

  return {
    cargosPorNome: new Map(cargos.map((c) => [normalizar(c.nome), c])),
    setoresPorNome: new Map(setores.map((s) => [normalizar(s.nome), s])),
    funcionariosPorNome: new Map(funcionarios.map((f) => [normalizar(f.nome), f])),
    cargoSetorMap,
  };
}

export async function previsualizarImportacao(linhas: LinhaBruta[]): Promise<LinhaValidada[]> {
  const contexto = await montarContexto();
  return linhas.map((linha, i) => validarLinha(i + 2, linha, contexto));
}

export async function confirmarImportacao(unidadeId: string, linhas: LinhaBruta[]) {
  const contexto = await montarContexto();
  const validadas = linhas.map((linha, i) => validarLinha(i + 2, linha, contexto));

  const validas = validadas.filter((l) => l.dados !== null);
  if (validas.length === 0) {
    return { inseridas: 0, ignoradas: validadas.length, error: "Nenhuma linha válida para importar" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("vagas").insert(
    validas.map((l) => ({
      unidade_id: unidadeId,
      cargo_id: l.dados!.cargo_id,
      setor_id: l.dados!.setor_id,
      motivo: l.dados!.motivo,
      horario_trabalho: l.dados!.horario_trabalho,
      gestor_id: l.dados!.gestor_id,
      data_abertura: l.dados!.data_abertura,
      sla_dias: l.dados!.sla_dias,
      numero_senior: l.dados!.numero_senior,
      justificativa: l.dados!.justificativa,
      situacao: l.dados!.situacao,
      candidato_aprovado: l.dados!.candidato_aprovado,
      data_fechamento: l.dados!.data_fechamento,
      data_admissao: l.dados!.data_admissao,
      observacoes: l.dados!.observacoes,
      recrutador_id: user?.id ?? null,
      ...(l.dados!.situacao === "cancelado"
        ? { data_cancelamento: new Date().toISOString().slice(0, 10) }
        : {}),
    }))
  );

  if (error) {
    return { inseridas: 0, ignoradas: validadas.length, error: error.message };
  }

  revalidatePath("/vagas");
  return {
    inseridas: validas.length,
    ignoradas: validadas.length - validas.length,
    error: null,
  };
}
