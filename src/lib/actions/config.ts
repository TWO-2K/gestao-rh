"use server";

import { createClient } from "@/lib/supabase/server";

const LOGO_BUCKET = "branding";
const MAX_LOGO_BYTES = 1024 * 1024;
const TIPOS_PERMITIDOS = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];

export async function definirLogo(formData: FormData) {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Nenhuma imagem foi selecionada." };
  }
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    return { error: "Formato inválido. Envie PNG, JPG, SVG ou WEBP." };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { error: "A imagem deve ter no máximo 1 MB." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data: profile } = await supabase.from("profiles").select("papel").eq("id", user.id).single();
  if (profile?.papel !== "admin" && profile?.papel !== "diretoria") {
    return { error: "Apenas administradores podem alterar o logo." };
  }

  const { data: atual } = await supabase.from("app_config").select("logo_path").eq("id", true).single();
  const caminhoAnterior = atual?.logo_path ?? null;

  const extensao = file.name.split(".").pop() || "png";
  const caminho = `logo-${Date.now()}.${extensao}`;
  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(caminho, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: uploadError.message };

  const { error: updateError } = await supabase
    .from("app_config")
    .update({ logo_path: caminho, logo_atualizado_por: user.id, logo_atualizado_em: new Date().toISOString() })
    .eq("id", true);
  if (updateError) {
    await supabase.storage.from(LOGO_BUCKET).remove([caminho]);
    return { error: updateError.message };
  }

  if (caminhoAnterior && caminhoAnterior !== caminho) {
    await supabase.storage.from(LOGO_BUCKET).remove([caminhoAnterior]);
  }

  return { error: null };
}
