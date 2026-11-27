import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// getClaims() já decodifica o JWT localmente (sem round-trip de rede), mas a
// busca do profile em si era uma query ao Postgres a cada requisição. Como o
// profile de um usuário quase não muda, cacheamos por userId (unstable_cache,
// compartilhado entre requisições) — as actions em usuarios.ts chamam
// updateTag("profiles") ao criar/editar um usuário. Mesmo assim usamos
// revalidate: 300s, para que uma falha transitória de rede/credenciais em
// produção não deixe o profile "não encontrado" cacheado indefinidamente
// (o erro PGRST116 de .single(), quando o profile de fato não existe, é
// esperado e não é logado).
const getProfileData = unstable_cache(
  async (userId: string) => {
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("id, nome, papel, funcionario_id")
      .eq("id", userId)
      .single();
    if (error && error.code !== "PGRST116") {
      console.error("getProfileData: falha ao buscar profile", userId, error);
    }
    return profile;
  },
  ["lookups-profile-por-id"],
  { tags: ["profiles"], revalidate: 300 }
);

export const getCurrentProfile = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) return null;

  const userId = claims.sub;
  const email = (claims.email as string | undefined) ?? "";

  const profile = await getProfileData(userId);

  return profile
    ? { ...profile, email }
    : {
        id: userId,
        nome: email || "Usuário",
        papel: "recrutador" as const,
        funcionario_id: null,
        email,
      };
});
