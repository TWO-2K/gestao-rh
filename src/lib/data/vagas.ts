import { createClient } from "@/lib/supabase/server";
import type { SituacaoVaga } from "@/types/database";

export type VagasFiltro = {
  unidade_id?: string;
  situacao?: SituacaoVaga;
  setor_id?: string;
  busca?: string;
  suspensa?: boolean;
};

export async function getVagas(
  filtro: VagasFiltro = {},
  paginacao?: { pagina: number; porPagina: number }
) {
  const supabase = await createClient();
  let query = supabase
    .from("vagas_detalhada")
    .select("*", { count: "exact" })
    .order("numero", { ascending: false });

  if (filtro.unidade_id) query = query.eq("unidade_id", filtro.unidade_id);
  if (filtro.situacao) query = query.eq("situacao", filtro.situacao);
  if (filtro.setor_id) query = query.eq("setor_id", filtro.setor_id);
  if (filtro.suspensa !== undefined) query = query.eq("suspensa", filtro.suspensa);
  if (filtro.busca) {
    query = query.or(
      `cargo_nome.ilike.%${filtro.busca}%,candidato_aprovado.ilike.%${filtro.busca}%,gestor_nome.ilike.%${filtro.busca}%`
    );
  }

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

  if (filtro.unidade_id) query = query.eq("unidade_id", filtro.unidade_id);
  if (filtro.situacao) query = query.eq("situacao", filtro.situacao);
  if (filtro.setor_id) query = query.eq("setor_id", filtro.setor_id);
  if (filtro.suspensa !== undefined) query = query.eq("suspensa", filtro.suspensa);
  if (filtro.busca) {
    query = query.or(
      `cargo_nome.ilike.%${filtro.busca}%,candidato_aprovado.ilike.%${filtro.busca}%,gestor_nome.ilike.%${filtro.busca}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
