"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PapelUsuario } from "@/types/database";

// Estas actions usam o client de serviço (bypassa RLS), então a checagem de
// papel precisa ficar aqui: diretoria só visualiza usuários, não cria/edita.
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

  if (profile?.papel !== "admin") {
    return { error: "Sem permissão" } as const;
  }
  return { error: null, papel: profile.papel } as const;
}

export async function criarUsuario(input: {
  funcionarioId: string;
  email: string;
  senha: string;
  papel: PapelUsuario;
  unidadeIds: string[];
}) {
  const guard = await exigirAdmin();
  if (guard.error) return guard;

  const email = input.email.trim().toLowerCase();
  if (!input.funcionarioId) return { error: "Selecione o funcionário a promover" };
  if (!email) return { error: "Informe o e-mail" };
  if (input.senha.length < 6) return { error: "A senha deve ter ao menos 6 caracteres" };

  const admin = createAdminClient();

  const { data: funcionario, error: errFuncionario } = await admin
    .from("funcionarios")
    .select("id, nome, email")
    .eq("id", input.funcionarioId)
    .single();
  if (errFuncionario || !funcionario) return { error: "Funcionário não encontrado" };

  const { data: jaPromovido } = await admin
    .from("profiles")
    .select("id")
    .eq("funcionario_id", input.funcionarioId)
    .maybeSingle();
  if (jaPromovido) return { error: "Este funcionário já tem um usuário do sistema" };

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.senha,
    email_confirm: true,
    user_metadata: { nome: funcionario.nome, papel: input.papel },
  });
  if (error) return { error: error.message };

  const { error: errProfile } = await admin
    .from("profiles")
    .update({ nome: funcionario.nome, papel: input.papel, funcionario_id: funcionario.id })
    .eq("id", data.user.id);
  if (errProfile) return { error: errProfile.message };

  if (input.unidadeIds.length > 0) {
    const rows = input.unidadeIds.map((unidade_id) => ({ profile_id: data.user.id, unidade_id }));
    await admin.from("profile_unidades").upsert(rows, { onConflict: "profile_id,unidade_id" });
  }

  if (funcionario.email !== email) {
    await admin.from("funcionarios").update({ email }).eq("id", funcionario.id);
  }

  revalidatePath("/usuarios");
  revalidatePath("/cadastros");
  return { error: null };
}

export async function atualizarUsuario(input: {
  id: string;
  nome: string;
  papel: PapelUsuario;
  unidadeIds: string[];
}) {
  const guard = await exigirAdmin();
  if (guard.error) return guard;

  const nome = input.nome.trim();
  if (!nome) return { error: "Informe o nome" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ nome, papel: input.papel })
    .eq("id", input.id);
  if (error) return { error: error.message };

  await admin.from("profile_unidades").delete().eq("profile_id", input.id);
  if (input.unidadeIds.length > 0) {
    const rows = input.unidadeIds.map((unidade_id) => ({ profile_id: input.id, unidade_id }));
    const { error: errUnidades } = await admin.from("profile_unidades").insert(rows);
    if (errUnidades) return { error: errUnidades.message };
  }

  revalidatePath("/usuarios");
  return { error: null };
}

export async function redefinirSenhaUsuario(id: string, novaSenha: string) {
  const guard = await exigirAdmin();
  if (guard.error) return guard;
  if (novaSenha.length < 6) return { error: "A senha deve ter ao menos 6 caracteres" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, { password: novaSenha });
  if (error) return { error: error.message };

  revalidatePath("/usuarios");
  return { error: null };
}

export async function alternarBloqueioUsuario(id: string, bloquear: boolean) {
  const guard = await exigirAdmin();
  if (guard.error) return guard;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, {
    ban_duration: bloquear ? "876000h" : "none",
  });
  if (error) return { error: error.message };

  revalidatePath("/usuarios");
  return { error: null };
}
