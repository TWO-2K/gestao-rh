import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getCurrentProfile = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) return null;

  const userId = claims.sub;
  const email = (claims.email as string | undefined) ?? "";

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nome, papel, funcionario_id")
    .eq("id", userId)
    .single();

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
