import { createClient } from "@/lib/supabase/server";

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
