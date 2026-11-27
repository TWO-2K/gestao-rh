import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Tabelas de referência (unidades, cargos, setores, horários) quase não
// mudam e são lidas em praticamente toda navegação (filtros, formulários).
// Usamos o client admin (sem cookies) porque unstable_cache não permite
// chamar APIs dinâmicas (cookies()) dentro do escopo cacheado; a leitura em
// si não expõe nada sensível e as policies de select já são "true" para
// qualquer autenticado. Os actions de Cadastros chamam revalidateTag nas
// mesmas tags ao criar/editar/excluir, então o cache nunca fica velho.
export const getUnidades = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("unidades")
      .select("id, nome, codigo, ativo")
      .eq("ativo", true)
      .order("nome");
    return data ?? [];
  },
  ["lookups-unidades-ativas"],
  { tags: ["unidades"] }
);

export const getAllUnidades = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("unidades")
      .select("id, nome, codigo, ativo")
      .order("nome");
    return data ?? [];
  },
  ["lookups-unidades-todas"],
  { tags: ["unidades"] }
);

export const getCargosComSetores = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("cargo_setor")
      .select("cargo_id, setor_id, cargos(nome), setores(nome)")
      .order("cargo_id");
    return data ?? [];
  },
  ["lookups-cargos-com-setores"],
  { tags: ["cargos", "setores"] }
);

export const getCargos = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data } = await supabase.from("cargos").select("id, nome").order("nome");
    return data ?? [];
  },
  ["lookups-cargos"],
  { tags: ["cargos"] }
);

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

export const getSetores = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data } = await supabase.from("setores").select("id, nome").order("nome");
    return data ?? [];
  },
  ["lookups-setores"],
  { tags: ["setores"] }
);

export const getHorariosTrabalho = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data } = await supabase.from("horarios_trabalho").select("id, nome").order("nome");
    return data ?? [];
  },
  ["lookups-horarios-trabalho"],
  { tags: ["horarios-trabalho"] }
);

export async function getFuncionarios() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("funcionarios")
    .select("id, nome, email, unidade_id, eh_gestor")
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
    .select("id, nome, email, unidade_id, ativo, eh_gestor", { count: "exact" })
    .order("nome")
    .range(from, to);
  if (error) throw error;
  return { data: data ?? [], total: count ?? 0 };
}

export async function getRecrutadores() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, nome")
    .eq("papel", "recrutador")
    .order("nome");
  return data ?? [];
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

export const getCargoSetorMap = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data } = await supabase.from("cargo_setor").select("cargo_id, setor_id");
    const map: Record<string, string[]> = {};
    for (const row of data ?? []) {
      if (!map[row.cargo_id]) map[row.cargo_id] = [];
      map[row.cargo_id].push(row.setor_id);
    }
    return map;
  },
  ["lookups-cargo-setor-map"],
  { tags: ["cargos", "setores"] }
);
