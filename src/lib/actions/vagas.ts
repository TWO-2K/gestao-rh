"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { vagaFormSchema, type VagaFormValues } from "@/lib/validators/vaga";

function emptyToNull(value: string | undefined) {
  return value && value.trim() !== "" ? value : null;
}

export async function criarVaga(values: VagaFormValues) {
  const parsed = vagaFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("vagas").insert({
    unidade_id: data.unidade_id,
    cargo_id: data.cargo_id,
    setor_id: data.setor_id,
    horario_trabalho: emptyToNull(data.horario_trabalho),
    gestor_id: emptyToNull(data.gestor_id),
    motivo: data.motivo,
    justificativa: emptyToNull(data.justificativa),
    data_abertura: data.data_abertura,
    sla_dias: data.sla_dias,
    numero_senior: emptyToNull(data.numero_senior),
    candidato_aprovado: emptyToNull(data.candidato_aprovado),
    data_fechamento: emptyToNull(data.data_fechamento),
    data_admissao: emptyToNull(data.data_admissao),
    observacoes: emptyToNull(data.observacoes),
    recrutador_id: user?.id ?? null,
    situacao: "em_aberto",
  });

  if (error) return { error: error.message };

  revalidatePath("/vagas");
  return { error: null };
}

export async function atualizarVaga(id: string, values: VagaFormValues) {
  const parsed = vagaFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  const supabase = await createClient();

  const situacao = data.data_fechamento ? "fechado" : undefined;

  const { error } = await supabase
    .from("vagas")
    .update({
      unidade_id: data.unidade_id,
      cargo_id: data.cargo_id,
      setor_id: data.setor_id,
      horario_trabalho: emptyToNull(data.horario_trabalho),
      gestor_id: emptyToNull(data.gestor_id),
      motivo: data.motivo,
      justificativa: emptyToNull(data.justificativa),
      data_abertura: data.data_abertura,
      sla_dias: data.sla_dias,
      numero_senior: emptyToNull(data.numero_senior),
      candidato_aprovado: emptyToNull(data.candidato_aprovado),
      data_fechamento: emptyToNull(data.data_fechamento),
      data_admissao: emptyToNull(data.data_admissao),
      observacoes: emptyToNull(data.observacoes),
      ...(situacao ? { situacao } : {}),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/vagas");
  return { error: null };
}

export async function alterarSituacaoVaga(
  id: string,
  situacao: "em_aberto" | "fechado" | "cancelado",
  extra?: { motivo_suspensao?: string; data_cancelamento?: string }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vagas")
    .update({
      situacao,
      ...(situacao === "cancelado"
        ? { data_cancelamento: extra?.data_cancelamento ?? new Date().toISOString().slice(0, 10) }
        : {}),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/vagas");
  return { error: null };
}

export async function alterarSuspensaoVaga(
  id: string,
  suspensa: boolean,
  motivoSuspensao?: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vagas")
    .update({
      suspensa,
      motivo_suspensao: suspensa ? motivoSuspensao ?? null : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/vagas");
  return { error: null };
}
