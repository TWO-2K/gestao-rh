"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function criarFuncionario(
  nome: string,
  unidadeId: string,
  email: string,
  ehGestor: boolean
) {
  if (!nome.trim()) return { error: "Informe o nome do funcionário" };
  const supabase = await createClient();
  const { error } = await supabase.from("funcionarios").insert({
    nome: nome.trim(),
    unidade_id: unidadeId || null,
    email: email.trim().toLowerCase() || null,
    eh_gestor: ehGestor,
  });
  if (error) return { error: error.message };
  revalidatePath("/cadastros");
  updateTag("funcionarios");
  return { error: null };
}

export async function atualizarFuncionario(
  id: string,
  nome: string,
  unidadeId: string,
  email: string,
  ehGestor: boolean
) {
  if (!nome.trim()) return { error: "Informe o nome do funcionário" };
  const emailNormalizado = email.trim().toLowerCase() || null;
  const supabase = await createClient();
  const { error } = await supabase
    .from("funcionarios")
    .update({
      nome: nome.trim(),
      unidade_id: unidadeId || null,
      email: emailNormalizado,
      eh_gestor: ehGestor,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  // Se este funcionário já tem um usuário do sistema vinculado (profiles.funcionario_id),
  // o e-mail de login (auth.users) precisa acompanhar o e-mail do funcionário — senão o
  // usuário continua logando com o e-mail antigo mesmo após a edição em Cadastros.
  if (emailNormalizado) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("funcionario_id", id)
      .maybeSingle();
    if (profile) {
      const { error: errAuth } = await admin.auth.admin.updateUserById(profile.id, {
        email: emailNormalizado,
        email_confirm: true,
      });
      if (errAuth) return { error: `Funcionário salvo, mas o e-mail de login não foi atualizado: ${errAuth.message}` };
      updateTag("profiles");
    }
  }

  revalidatePath("/cadastros");
  revalidatePath("/usuarios");
  updateTag("funcionarios");
  return { error: null };
}

export async function alternarAtivoFuncionario(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("funcionarios").update({ ativo }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/cadastros");
  updateTag("funcionarios");
  return { error: null };
}
