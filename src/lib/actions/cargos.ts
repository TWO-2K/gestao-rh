"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function criarSetor(nome: string) {
  if (!nome.trim()) return { error: "Informe o nome do setor" };
  const supabase = await createClient();
  const { error } = await supabase.from("setores").insert({ nome: nome.trim() });
  if (error) return { error: error.message };
  revalidatePath("/cadastros");
  return { error: null };
}

export async function atualizarSetor(id: string, nome: string) {
  if (!nome.trim()) return { error: "Informe o nome do setor" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("setores")
    .update({ nome: nome.trim() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/cadastros");
  return { error: null };
}

export async function excluirSetor(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("setores").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      return {
        error: "Não é possível excluir: este setor está em uso por cargos ou vagas.",
      };
    }
    return { error: error.message };
  }
  revalidatePath("/cadastros");
  return { error: null };
}

export async function criarCargo(nome: string, setorIds: string[]) {
  if (!nome.trim()) return { error: "Informe o nome do cargo" };
  if (setorIds.length === 0) return { error: "Selecione ao menos um setor" };
  const supabase = await createClient();
  const { data: cargo, error } = await supabase
    .from("cargos")
    .insert({ nome: nome.trim() })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const { error: vinculoError } = await supabase
    .from("cargo_setor")
    .insert(setorIds.map((setorId) => ({ cargo_id: cargo.id, setor_id: setorId })));
  if (vinculoError) return { error: vinculoError.message };

  revalidatePath("/cadastros");
  return { error: null };
}
