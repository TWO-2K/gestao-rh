"use server";

import { createClient } from "@/lib/supabase/server";

const ASSINATURA_BUCKET = "assinaturas";
const ASSINATURA_URL_TTL_SEGUNDOS = 60 * 60;
const MAX_ASSINATURA_BYTES = 512 * 1024;

export async function obterMeuPerfil() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, papel, funcionario_id")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  let assinaturaUrl: string | null = null;
  if (profile.funcionario_id) {
    const { data: funcionario } = await supabase
      .from("funcionarios")
      .select("assinatura_path")
      .eq("id", profile.funcionario_id)
      .single();
    if (funcionario?.assinatura_path) {
      const { data } = await supabase.storage
        .from(ASSINATURA_BUCKET)
        .createSignedUrl(funcionario.assinatura_path, ASSINATURA_URL_TTL_SEGUNDOS);
      assinaturaUrl = data?.signedUrl ?? null;
    }
  }

  return {
    nome: profile.nome as string,
    email: user.email ?? "",
    papel: profile.papel as string,
    assinaturaUrl,
  };
}

export async function definirMinhaAssinatura(formData: FormData) {
  const file = formData.get("assinatura");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Nenhuma assinatura foi desenhada." };
  }
  if (file.type !== "image/png") {
    return { error: "Formato inválido. A assinatura deve ser enviada em PNG." };
  }
  if (file.size > MAX_ASSINATURA_BYTES) {
    return { error: "A assinatura deve ter no máximo 512 KB." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("funcionario_id")
    .eq("id", user.id)
    .single();
  if (!profile?.funcionario_id) {
    return { error: "Sua conta não está vinculada a um funcionário. Fale com o RH." };
  }

  const { data: funcionario } = await supabase
    .from("funcionarios")
    .select("assinatura_path")
    .eq("id", profile.funcionario_id)
    .single();
  const caminhoAnterior = funcionario?.assinatura_path ?? null;

  const caminho = `funcionarios/${profile.funcionario_id}/${Date.now()}.png`;
  const { error: uploadError } = await supabase.storage
    .from(ASSINATURA_BUCKET)
    .upload(caminho, file, { contentType: "image/png", upsert: false });
  if (uploadError) return { error: uploadError.message };

  const { error: rpcError } = await supabase.rpc("fn_definir_minha_assinatura", {
    p_path: caminho,
  });
  if (rpcError) {
    await supabase.storage.from(ASSINATURA_BUCKET).remove([caminho]);
    return { error: rpcError.message };
  }

  if (caminhoAnterior && caminhoAnterior !== caminho) {
    await supabase.storage.from(ASSINATURA_BUCKET).remove([caminhoAnterior]);
  }

  return { error: null };
}

export async function removerMinhaAssinatura() {
  const supabase = await createClient();
  const { data: caminhoAnterior, error } = await supabase.rpc("fn_remover_minha_assinatura");
  if (error) return { error: error.message };

  if (caminhoAnterior) {
    await supabase.storage.from(ASSINATURA_BUCKET).remove([caminhoAnterior]);
  }

  return { error: null };
}
