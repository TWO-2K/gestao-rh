import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MARCA } from "@/lib/constants";

const LOGO_BUCKET = "branding";

export async function getLogoUrl() {
  const supabase = await createClient();
  const { data } = await supabase.from("app_config").select("logo_path").eq("id", true).single();

  if (!data?.logo_path) return MARCA.logoSupermercado;

  return supabase.storage.from(LOGO_BUCKET).getPublicUrl(data.logo_path).data.publicUrl;
}

export async function getAppConfig() {
  const supabase = await createClient();
  const { data } = await supabase.from("app_config").select("logo_path").eq("id", true).single();

  const logoUrl = data?.logo_path
    ? supabase.storage.from(LOGO_BUCKET).getPublicUrl(data.logo_path).data.publicUrl
    : null;

  return { logoUrl };
}

export async function getUsuariosComPushAtivo() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const [{ data: subs, error }, { data: profiles }, { data: authList }] = await Promise.all([
    supabase
      .from("push_subscriptions")
      .select("profile_id, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, nome"),
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);

  if (error || !subs) return [];

  const nomePorId = new Map((profiles ?? []).map((p) => [p.id, p.nome]));
  const emailPorId = new Map(authList?.users.map((u) => [u.id, u.email ?? ""]));

  const porUsuario = new Map<
    string,
    { nome: string; email: string; dispositivos: number; ultimaAtivacao: string }
  >();

  for (const row of subs) {
    const existente = porUsuario.get(row.profile_id);
    if (existente) {
      existente.dispositivos += 1;
      continue;
    }

    porUsuario.set(row.profile_id, {
      nome: nomePorId.get(row.profile_id) ?? "—",
      email: emailPorId.get(row.profile_id) ?? "",
      dispositivos: 1,
      ultimaAtivacao: row.created_at,
    });
  }

  return Array.from(porUsuario.values());
}
