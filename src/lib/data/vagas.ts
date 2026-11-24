import { createClient } from "@/lib/supabase/server";

export type VagasFiltro = {
  unidade_id?: string;
  situacao?: "em_aberto" | "fechado" | "cancelado";
  setor_id?: string;
  busca?: string;
};

export async function getVagas(filtro: VagasFiltro = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("vagas_detalhada")
    .select("*")
    .order("numero", { ascending: false });

  if (filtro.unidade_id) query = query.eq("unidade_id", filtro.unidade_id);
  if (filtro.situacao) query = query.eq("situacao", filtro.situacao);
  if (filtro.setor_id) query = query.eq("setor_id", filtro.setor_id);
  if (filtro.busca) {
    query = query.or(
      `cargo_nome.ilike.%${filtro.busca}%,candidato_aprovado.ilike.%${filtro.busca}%,gestor_nome.ilike.%${filtro.busca}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
