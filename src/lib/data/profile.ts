import { createClient } from "@/lib/supabase/server";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nome, papel")
    .eq("id", user.id)
    .single();

  return profile
    ? { ...profile, email: user.email ?? "" }
    : { id: user.id, nome: user.email ?? "Usuário", papel: "recrutador" as const, email: user.email ?? "" };
}
