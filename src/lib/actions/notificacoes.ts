"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TipoNotificacao } from "@/lib/constants";

async function exigirAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (profile?.papel !== "admin" && profile?.papel !== "diretoria") {
    return { error: "Sem permissão" } as const;
  }
  return { error: null, userId: user.id } as const;
}

export async function alterarTipoNotificacaoAtivo(tipo: TipoNotificacao, ativo: boolean) {
  const guard = await exigirAdmin();
  if (guard.error) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("notificacao_tipo_config").upsert(
    {
      tipo,
      ativo,
      atualizado_por: guard.userId,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "tipo" }
  );

  if (error) return { error: error.message };
  revalidatePath("/configuracoes");
  return { error: null };
}

export async function marcarComoLida(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notificacoes")
    .update({ lida: true, lida_em: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/notificacoes");
  return { error: null };
}

export async function marcarTodasComoLidas() {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notificacoes")
    .update({ lida: true, lida_em: new Date().toISOString() })
    .eq("lida", false);

  if (error) return { error: error.message };
  revalidatePath("/notificacoes");
  return { error: null };
}

export async function salvarPushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      profile_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: null,
    },
    { onConflict: "endpoint" }
  );

  if (error) return { error: error.message };
  return { error: null };
}

export async function removerPushSubscription(endpoint: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);

  if (error) return { error: error.message };
  return { error: null };
}

export async function temPushAtivo() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id);

  return (count ?? 0) > 0;
}
