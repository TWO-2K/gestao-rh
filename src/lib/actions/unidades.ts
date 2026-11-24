"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function criarUnidade(nome: string, codigo: string) {
  if (!nome.trim()) return { error: "Informe o nome da unidade" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("unidades")
    .insert({ nome: nome.trim(), codigo: codigo.trim() || null });
  if (error) return { error: error.message };
  revalidatePath("/cadastros");
  return { error: null };
}

export async function atualizarUnidade(id: string, nome: string, codigo: string) {
  if (!nome.trim()) return { error: "Informe o nome da unidade" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("unidades")
    .update({ nome: nome.trim(), codigo: codigo.trim() || null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/cadastros");
  return { error: null };
}

export async function alternarAtivoUnidade(id: string, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("unidades").update({ ativo }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/cadastros");
  return { error: null };
}
