"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getVagasParaExportar, type VagasFiltro } from "@/lib/data/vagas";
import { enviarPush, enviarPushPorPapel } from "@/lib/push";
import {
  solicitarVagaSchema,
  vagaFormSchema,
  type SolicitarVagaValues,
  type VagaFormValues,
} from "@/lib/validators/vaga";

export async function buscarVagasParaExportar(filtro: VagasFiltro) {
  return getVagasParaExportar(filtro);
}

function emptyToNull(value: string | undefined) {
  return value && value.trim() !== "" ? value : null;
}

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

  if (profile?.papel !== "admin" && profile?.papel !== "diretoria") {
    return { error: "Sem permissão" } as const;
  }
  return { error: null } as const;
}

export async function solicitarVaga(values: SolicitarVagaValues) {
  const parsed = solicitarVagaSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

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
    .select("unidade_id")
    .eq("id", profile.funcionario_id)
    .single();
  if (!funcionario?.unidade_id) {
    return { error: "Seu cadastro de funcionário não tem unidade definida. Fale com o RH." };
  }

  const situacao = data.motivo === "aumento_de_quadro" ? "pendente_aprovacao" : "em_aberto";

  const { data: novaVaga, error } = await supabase
    .from("vagas")
    .insert({
      unidade_id: funcionario.unidade_id,
      cargo_id: data.cargo_id,
      setor_id: data.setor_id,
      motivo: data.motivo,
      horario_trabalho: emptyToNull(data.horario_trabalho),
      justificativa: emptyToNull(data.justificativa),
      gestor_id: profile.funcionario_id,
      data_abertura: new Date().toISOString().slice(0, 10),
      sla_dias: 20,
      situacao,
    })
    .select("id, numero, cargos(nome)")
    .single();

  if (error) return { error: error.message };

  if (situacao === "pendente_aprovacao" && novaVaga) {
    const cargoNome = novaVaga.cargos?.nome ?? "vaga";
    const titulo = "Nova solicitação aguardando aprovação";
    const mensagem = `Solicitação de aumento de quadro para ${cargoNome} (nº ${novaVaga.numero}) aguarda aprovação da diretoria.`;
    await supabase.rpc("fn_notificar_por_papel", {
      p_papel: "admin",
      p_tipo: "vaga_pendente_aprovacao",
      p_titulo: titulo,
      p_mensagem: mensagem,
      p_vaga_id: novaVaga.id,
    });
    await supabase.rpc("fn_notificar_por_papel", {
      p_papel: "diretoria",
      p_tipo: "vaga_pendente_aprovacao",
      p_titulo: titulo,
      p_mensagem: mensagem,
      p_vaga_id: novaVaga.id,
    });
    await enviarPushPorPapel(["admin", "diretoria"], {
      titulo,
      mensagem,
      url: "/vagas",
    });
  }

  revalidatePath("/portal-gestor");
  return { error: null };
}

export async function atualizarMinhaSolicitacao(id: string, values: SolicitarVagaValues) {
  const parsed = solicitarVagaSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const { data: atualizada, error } = await supabase
    .from("vagas")
    .update({
      cargo_id: data.cargo_id,
      setor_id: data.setor_id,
      motivo: data.motivo,
      horario_trabalho: emptyToNull(data.horario_trabalho),
      justificativa: emptyToNull(data.justificativa),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!atualizada) {
    return {
      error: "Esta solicitação não pode mais ser editada (já está sendo tratada pelo RH).",
    };
  }

  revalidatePath("/vagas");
  return { error: null };
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

  const { data: vagaAnterior } = await supabase
    .from("vagas")
    .select("situacao, gestor_id, numero, cargos(nome)")
    .eq("id", id)
    .single();

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

  if (situacao === "fechado" && vagaAnterior?.situacao !== "fechado" && vagaAnterior?.gestor_id) {
    const { data: gestorProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("funcionario_id", vagaAnterior.gestor_id)
      .maybeSingle();

    if (gestorProfile) {
      const cargoNome = vagaAnterior.cargos?.nome ?? "vaga";
      const candidato = emptyToNull(data.candidato_aprovado);
      const titulo = "Vaga fechada com sucesso";
      const mensagem = `A vaga de ${cargoNome} (nº ${vagaAnterior.numero}) que você solicitou foi fechada${
        candidato ? ` com a admissão de ${candidato}` : ""
      }.`;
      await supabase.rpc("fn_criar_notificacao", {
        p_destinatario_id: gestorProfile.id,
        p_tipo: "vaga_fechada",
        p_titulo: titulo,
        p_mensagem: mensagem,
        p_vaga_id: id,
      });
      await enviarPush(gestorProfile.id, { titulo, mensagem, url: "/notificacoes" });
    }
  }

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

export async function aprovarVaga(id: string) {
  const guard = await exigirAdmin();
  if (guard.error) return guard;

  const supabase = await createClient();
  const { data: vaga, error: errVaga } = await supabase
    .from("vagas")
    .select("gestor_id, numero, cargos(nome)")
    .eq("id", id)
    .single();
  if (errVaga) return { error: errVaga.message };

  const { error } = await supabase
    .from("vagas")
    .update({ situacao: "em_aberto" })
    .eq("id", id);

  if (error) return { error: error.message };

  if (vaga?.gestor_id) {
    const { data: gestorProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("funcionario_id", vaga.gestor_id)
      .maybeSingle();

    if (gestorProfile) {
      const cargoNome = vaga.cargos?.nome ?? "vaga";
      const titulo = "Solicitação de vaga aprovada";
      const mensagem = `A solicitação de ${cargoNome} (nº ${vaga.numero}) foi aprovada pela diretoria e entrou em recrutamento.`;
      await supabase.rpc("fn_criar_notificacao", {
        p_destinatario_id: gestorProfile.id,
        p_tipo: "vaga_aprovada",
        p_titulo: titulo,
        p_mensagem: mensagem,
        p_vaga_id: id,
      });
      await enviarPush(gestorProfile.id, { titulo, mensagem, url: "/notificacoes" });
    }
  }

  revalidatePath("/vagas");
  return { error: null };
}

export async function rejeitarVaga(id: string, motivo: string) {
  const guard = await exigirAdmin();
  if (guard.error) return guard;

  const supabase = await createClient();
  const { data: vaga, error: errVaga } = await supabase
    .from("vagas")
    .select("observacoes, gestor_id, numero, cargos(nome)")
    .eq("id", id)
    .single();
  if (errVaga) return { error: errVaga.message };

  const motivoTratado = motivo.trim();
  const rejeicao = `Rejeitado pela diretoria: ${motivoTratado}`;
  const observacoes = vaga?.observacoes ? `${vaga.observacoes}\n${rejeicao}` : rejeicao;

  const { error } = await supabase
    .from("vagas")
    .update({
      situacao: "cancelado",
      observacoes,
      data_cancelamento: new Date().toISOString().slice(0, 10),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  if (vaga?.gestor_id) {
    const { data: gestorProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("funcionario_id", vaga.gestor_id)
      .maybeSingle();

    if (gestorProfile) {
      const cargoNome = vaga.cargos?.nome ?? "vaga";
      const titulo = "Solicitação de vaga rejeitada";
      const mensagem = `A solicitação de ${cargoNome} (nº ${vaga.numero}) foi rejeitada pela diretoria: ${motivoTratado}.`;
      await supabase.rpc("fn_criar_notificacao", {
        p_destinatario_id: gestorProfile.id,
        p_tipo: "vaga_rejeitada",
        p_titulo: titulo,
        p_mensagem: mensagem,
        p_vaga_id: id,
      });
      await enviarPush(gestorProfile.id, { titulo, mensagem, url: "/notificacoes" });
    }
  }

  revalidatePath("/vagas");
  return { error: null };
}

export async function cancelarVaga(id: string, motivo: string) {
  const supabase = await createClient();
  const { data: vaga, error: errVaga } = await supabase
    .from("vagas")
    .select("observacoes, gestor_id, numero, cargos(nome)")
    .eq("id", id)
    .single();
  if (errVaga) return { error: errVaga.message };

  const motivoTratado = motivo.trim();
  const cancelamento = `Cancelado: ${motivoTratado}`;
  const observacoes = vaga?.observacoes ? `${vaga.observacoes}\n${cancelamento}` : cancelamento;

  const { error } = await supabase
    .from("vagas")
    .update({
      situacao: "cancelado",
      observacoes,
      data_cancelamento: new Date().toISOString().slice(0, 10),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  if (vaga?.gestor_id) {
    const { data: gestorProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("funcionario_id", vaga.gestor_id)
      .maybeSingle();

    if (gestorProfile) {
      const cargoNome = vaga.cargos?.nome ?? "vaga";
      const titulo = "Vaga cancelada";
      const mensagem = `A solicitação de ${cargoNome} (nº ${vaga.numero}) foi cancelada: ${motivoTratado}.`;
      await supabase.rpc("fn_criar_notificacao", {
        p_destinatario_id: gestorProfile.id,
        p_tipo: "vaga_cancelada",
        p_titulo: titulo,
        p_mensagem: mensagem,
        p_vaga_id: id,
      });
      await enviarPush(gestorProfile.id, { titulo, mensagem, url: "/notificacoes" });
    }
  }

  revalidatePath("/vagas");
  return { error: null };
}

export async function getHistoricoVaga(vagaId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("historico_status")
    .select("id, situacao_anterior, situacao_nova, alterado_em, observacao, profiles(nome)")
    .eq("vaga_id", vagaId)
    .order("alterado_em", { ascending: false });

  if (error) return { error: error.message, data: null };
  return { error: null, data };
}

export async function atualizarStatusExperiencia(
  id: string,
  periodo: 1 | 2,
  status: "aprovado" | "reprovado"
) {
  const supabase = await createClient();
  const update =
    periodo === 1 ? { experiencia_1_status: status } : { experiencia_2_status: status };
  const { error } = await supabase.from("vagas").update(update).eq("id", id);

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
