import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Tabelas de referência (unidades, cargos, setores, horários) quase não
// mudam e são lidas em praticamente toda navegação (filtros, formulários).
// Usamos o client admin (sem cookies) porque unstable_cache não permite
// chamar APIs dinâmicas (cookies()) dentro do escopo cacheado; a leitura em
// si não expõe nada sensível e as policies de select já são "true" para
// qualquer autenticado. Os actions de Cadastros chamam revalidateTag nas
// mesmas tags ao criar/editar/excluir. Além disso cada função lança o erro
// do Supabase (em vez de engolir e cachear um array vazio) e usa
// revalidate: 300s, para que uma falha transitória em produção não deixe o
// cache travado indefinidamente com uma lista vazia.
export const getUnidades = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("unidades")
      .select("id, nome, codigo, ativo")
      .eq("ativo", true)
      .order("nome");
    if (error) {
      console.error("getUnidades: falha ao buscar unidades", error);
      throw error;
    }
    return data ?? [];
  },
  ["lookups-unidades-ativas"],
  { tags: ["unidades"], revalidate: 300 }
);

export const getAllUnidades = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("unidades")
      .select("id, nome, codigo, ativo")
      .order("nome");
    if (error) {
      console.error("getAllUnidades: falha ao buscar unidades", error);
      throw error;
    }
    return data ?? [];
  },
  ["lookups-unidades-todas"],
  { tags: ["unidades"], revalidate: 300 }
);

export const getCargosComSetores = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("cargo_setor")
      .select("cargo_id, setor_id, cargos(nome), setores(nome)")
      .order("cargo_id");
    if (error) {
      console.error("getCargosComSetores: falha ao buscar cargo_setor", error);
      throw error;
    }
    return data ?? [];
  },
  ["lookups-cargos-com-setores"],
  { tags: ["cargos", "setores"], revalidate: 300 }
);

export const getCargos = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("cargos").select("id, nome").order("nome");
    if (error) {
      console.error("getCargos: falha ao buscar cargos", error);
      throw error;
    }
    return data ?? [];
  },
  ["lookups-cargos"],
  { tags: ["cargos"], revalidate: 300 }
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
    const { data, error } = await supabase.from("setores").select("id, nome").order("nome");
    if (error) {
      console.error("getSetores: falha ao buscar setores", error);
      throw error;
    }
    return data ?? [];
  },
  ["lookups-setores"],
  { tags: ["setores"], revalidate: 300 }
);

export const getHorariosTrabalho = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("horarios_trabalho")
      .select("id, nome")
      .order("nome");
    if (error) {
      console.error("getHorariosTrabalho: falha ao buscar horarios_trabalho", error);
      throw error;
    }
    return data ?? [];
  },
  ["lookups-horarios-trabalho"],
  { tags: ["horarios-trabalho"], revalidate: 300 }
);

export const getFuncionarios = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("funcionarios")
      .select("id, nome, email, unidade_id, eh_gestor")
      .eq("ativo", true)
      .order("nome");
    if (error) {
      console.error("getFuncionarios: falha ao buscar funcionarios", error);
      throw error;
    }
    return data ?? [];
  },
  ["lookups-funcionarios-ativos"],
  { tags: ["funcionarios"], revalidate: 300 }
);

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

export const getRecrutadores = unstable_cache(
  async () => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nome")
      .eq("papel", "recrutador")
      .order("nome");
    if (error) {
      console.error("getRecrutadores: falha ao buscar recrutadores", error);
      throw error;
    }
    return data ?? [];
  },
  ["lookups-recrutadores"],
  { tags: ["recrutadores"], revalidate: 300 }
);

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
    const { data, error } = await supabase.from("cargo_setor").select("cargo_id, setor_id");
    if (error) {
      console.error("getCargoSetorMap: falha ao buscar cargo_setor", error);
      throw error;
    }
    const map: Record<string, string[]> = {};
    for (const row of data ?? []) {
      if (!map[row.cargo_id]) map[row.cargo_id] = [];
      map[row.cargo_id].push(row.setor_id);
    }
    return map;
  },
  ["lookups-cargo-setor-map"],
  { tags: ["cargos", "setores"], revalidate: 300 }
);
