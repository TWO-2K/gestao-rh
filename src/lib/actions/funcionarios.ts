"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const { error } = await supabase
    .from("funcionarios")
    .update({
      nome: nome.trim(),
      unidade_id: unidadeId || null,
      email: email.trim().toLowerCase() || null,
      eh_gestor: ehGestor,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/cadastros");
  return { error: null };
}

export async function alternarAtivoFuncionario(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("funcionarios").update({ ativo }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/cadastros");
  return { error: null };
}
