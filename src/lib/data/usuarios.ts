import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getUsuarios() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const [{ data: profiles }, { data: profileUnidades }, { data: authList }] =
    await Promise.all([
      supabase.from("profiles").select("id, nome, papel, funcionario_id").order("nome"),
      supabase.from("profile_unidades").select("profile_id, unidades(id, nome)"),
      admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);

  const emailPorId = new Map(authList?.users.map((u) => [u.id, u.email ?? ""]));
  const bloqueadoPorId = new Map(
    authList?.users.map((u) => [
      u.id,
      !!u.banned_until && new Date(u.banned_until) > new Date(),
    ])
  );

  const unidadesPorProfile = new Map<string, { id: string; nome: string }[]>();
  for (const row of profileUnidades ?? []) {
    const unidade = row.unidades as unknown as { id: string; nome: string } | null;
    if (!unidade) continue;
    if (!unidadesPorProfile.has(row.profile_id)) unidadesPorProfile.set(row.profile_id, []);
    unidadesPorProfile.get(row.profile_id)!.push(unidade);
  }

  return (profiles ?? []).map((p) => ({
    ...p,
    email: emailPorId.get(p.id) ?? "",
    bloqueado: bloqueadoPorId.get(p.id) ?? false,
    unidades: unidadesPorProfile.get(p.id) ?? [],
  }));
}
