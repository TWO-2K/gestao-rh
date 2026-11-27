import { createClient } from "@/lib/supabase/server";
import type { MotivoVaga, SituacaoVaga } from "@/types/database";

export type VagasFiltro = {
  unidade_id?: string;
  situacao?: SituacaoVaga;
  setor_id?: string;
  cargo_id?: string;
  motivo?: MotivoVaga;
  horario_trabalho_id?: string;
  gestor_id?: string;
  recrutador_id?: string;
  status_sla?: string;
  busca?: string;
  suspensa?: boolean;
  data_abertura_de?: string;
  data_abertura_ate?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aplicarFiltros<T extends { eq: any; or: any; gte: any; lte: any }>(
  query: T,
  filtro: VagasFiltro
): T {
  if (filtro.unidade_id) query = query.eq("unidade_id", filtro.unidade_id);
  if (filtro.situacao) query = query.eq("situacao", filtro.situacao);
  if (filtro.setor_id) query = query.eq("setor_id", filtro.setor_id);
  if (filtro.cargo_id) query = query.eq("cargo_id", filtro.cargo_id);
  if (filtro.motivo) query = query.eq("motivo", filtro.motivo);
  if (filtro.horario_trabalho_id) query = query.eq("horario_trabalho_id", filtro.horario_trabalho_id);
  if (filtro.gestor_id) query = query.eq("gestor_id", filtro.gestor_id);
  if (filtro.recrutador_id) query = query.eq("recrutador_id", filtro.recrutador_id);
  if (filtro.status_sla) query = query.eq("status_sla", filtro.status_sla);
  if (filtro.suspensa !== undefined) query = query.eq("suspensa", filtro.suspensa);
  if (filtro.data_abertura_de) query = query.gte("data_abertura", filtro.data_abertura_de);
  if (filtro.data_abertura_ate) query = query.lte("data_abertura", filtro.data_abertura_ate);
  if (filtro.busca) {
    query = query.or(
      `cargo_nome.ilike.%${filtro.busca}%,candidato_aprovado.ilike.%${filtro.busca}%,gestor_nome.ilike.%${filtro.busca}%`
    );
  }
  return query;
}

export async function getVagas(
  filtro: VagasFiltro = {},
  paginacao?: { pagina: number; porPagina: number }
) {
  const supabase = await createClient();
  let query = supabase
    .from("vagas_detalhada")
    .select("*", { count: "exact" })
    .order("numero", { ascending: false });

  query = aplicarFiltros(query, filtro);

  if (paginacao) {
    const from = (paginacao.pagina - 1) * paginacao.porPagina;
    const to = from + paginacao.porPagina - 1;
    query = query.range(from, to);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { vagas: data ?? [], total: count ?? 0 };
}

export async function getVagasParaExportar(filtro: VagasFiltro = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("vagas_detalhada")
    .select("*")
    .order("numero", { ascending: false });

  query = aplicarFiltros(query, filtro);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
