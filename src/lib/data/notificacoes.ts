import { createClient } from "@/lib/supabase/server";
import { TIPO_NOTIFICACAO_LABEL, type TipoNotificacao } from "@/lib/constants";

export async function getConfigTiposNotificacao() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("notificacao_tipo_config").select("tipo, ativo");
  if (error) throw error;

  const ativoPorTipo = new Map(data?.map((row) => [row.tipo, row.ativo]));

  return (Object.keys(TIPO_NOTIFICACAO_LABEL) as TipoNotificacao[])
    .filter((tipo) => tipo !== "teste")
    .map((tipo) => ({
      tipo,
      label: TIPO_NOTIFICACAO_LABEL[tipo],
      ativo: ativoPorTipo.get(tipo) ?? true,
    }));
}

export async function getMinhasNotificacoes(filtro: { lida?: boolean } = {}, limit = 50) {
  const supabase = await createClient();
  let query = supabase
    .from("notificacoes")
    .select("id, tipo, titulo, mensagem, vaga_id, lida, lida_em, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filtro.lida !== undefined) query = query.eq("lida", filtro.lida);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getContagemNaoLidas() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notificacoes")
    .select("id", { count: "exact", head: true })
    .eq("lida", false);

  if (error) throw error;
  return count ?? 0;
}
