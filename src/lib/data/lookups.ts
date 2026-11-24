import { createClient } from "@/lib/supabase/server";

export async function getUnidades() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("unidades")
    .select("id, nome, codigo, ativo")
    .eq("ativo", true)
    .order("nome");
  return data ?? [];
}

export async function getAllUnidades() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("unidades")
    .select("id, nome, codigo, ativo")
    .order("nome");
  return data ?? [];
}

export async function getCargosComSetores() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cargo_setor")
    .select("cargo_id, setor_id, cargos(nome), setores(nome)")
    .order("cargo_id");
  return data ?? [];
}

export async function getCargos() {
  const supabase = await createClient();
  const { data } = await supabase.from("cargos").select("id, nome").order("nome");
  return data ?? [];
}

// Lista paginada para a tela de Cadastros (a catálogo completo pode ter
// centenas de cargos). getCargos() acima continua sem paginação, pois
// alimenta os selects de formulário, que precisam de todas as opções.
export async function getCargosPaginado(pagina: number, porPagina: number) {
  const supabase = await createClient();
  const from = (pagina - 1) * porPagina;
  const to = from + porPagina - 1;
  const { data, count, error } = await supabase
    .from("cargos")
    .select("id, nome", { count: "exact" })
    .order("nome")
    .range(from, to);
  if (error) throw error;
  return { data: data ?? [], total: count ?? 0 };
}

export async function getSetores() {
  const supabase = await createClient();
  const { data } = await supabase.from("setores").select("id, nome").order("nome");
  return data ?? [];
}

export async function getFuncionarios() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("funcionarios")
    .select("id, nome, email")
    .eq("ativo", true)
    .order("nome");
  return data ?? [];
}

// Lista paginada para a tela de Cadastros (o quadro de funcionários real
// pode crescer para centenas de registros entre as unidades).
export async function getFuncionariosPaginado(pagina: number, porPagina: number) {
  const supabase = await createClient();
  const from = (pagina - 1) * porPagina;
  const to = from + porPagina - 1;
  const { data, count, error } = await supabase
    .from("funcionarios")
    .select("id, nome, email, unidade_id, ativo", { count: "exact" })
    .order("nome")
    .range(from, to);
  if (error) throw error;
  return { data: data ?? [], total: count ?? 0 };
}

export async function getVagasAbertasPorSetor() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vagas")
    .select("setor_id")
    .eq("situacao", "em_aberto");
  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    map[row.setor_id] = (map[row.setor_id] ?? 0) + 1;
  }
  return map;
}

export async function getCargoSetorMap() {
  const supabase = await createClient();
  const { data } = await supabase.from("cargo_setor").select("cargo_id, setor_id");
  const map: Record<string, string[]> = {};
  for (const row of data ?? []) {
    if (!map[row.cargo_id]) map[row.cargo_id] = [];
    map[row.cargo_id].push(row.setor_id);
  }
  return map;
}
