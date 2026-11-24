import { createClient } from "@/lib/supabase/server";

export async function getDashboardData() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("vagas_detalhada").select("*");
  if (error) throw error;

  const vagas = data ?? [];
  const abertas = vagas.filter((v) => v.situacao === "em_aberto");
  const emAtraso = abertas.filter((v) => v.status_sla === "em_atraso");
  const suspensas = vagas.filter((v) => v.suspensa);
  const fechadas = vagas.filter((v) => v.situacao === "fechado");
  const pendentesAprovacao = vagas.filter((v) => v.situacao === "pendente_aprovacao");

  const tempoMedioFechamento =
    fechadas.length > 0
      ? Math.round(
          fechadas.reduce((acc, v) => acc + (v.dias_em_aberto ?? 0), 0) / fechadas.length
        )
      : 0;

  const porUnidade = Object.values(
    abertas.reduce<Record<string, { unidade: string; quantidade: number }>>((acc, v) => {
      acc[v.unidade_nome] ??= { unidade: v.unidade_nome, quantidade: 0 };
      acc[v.unidade_nome].quantidade += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.quantidade - a.quantidade);

  const porSetor = Object.values(
    abertas.reduce<Record<string, { setor: string; quantidade: number }>>((acc, v) => {
      acc[v.setor_nome] ??= { setor: v.setor_nome, quantidade: 0 };
      acc[v.setor_nome].quantidade += 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 8);

  const porMotivo = Object.values(
    abertas.reduce<Record<string, { motivo: string; quantidade: number }>>((acc, v) => {
      acc[v.motivo] ??= { motivo: v.motivo, quantidade: 0 };
      acc[v.motivo].quantidade += 1;
      return acc;
    }, {})
  );

  const proximosVencimentosExperiencia = vagas
    .filter((v) => v.situacao === "fechado" && v.periodo_experiencia_1)
    .map((v) => ({
      id: v.id,
      candidato: v.candidato_aprovado,
      unidade: v.unidade_nome,
      cargo: v.cargo_nome,
      periodo_experiencia_1: v.periodo_experiencia_1,
      periodo_experiencia_2: v.periodo_experiencia_2,
    }))
    .filter((v) => {
      const hoje = new Date();
      const p1 = v.periodo_experiencia_1 ? new Date(v.periodo_experiencia_1) : null;
      const p2 = v.periodo_experiencia_2 ? new Date(v.periodo_experiencia_2) : null;
      const em15dias = new Date();
      em15dias.setDate(hoje.getDate() + 15);
      return (p1 && p1 >= hoje && p1 <= em15dias) || (p2 && p2 >= hoje && p2 <= em15dias);
    });

  return {
    vagas,
    totalAbertas: abertas.length,
    totalEmAtraso: emAtraso.length,
    totalSuspensas: suspensas.length,
    totalPendentesAprovacao: pendentesAprovacao.length,
    tempoMedioFechamento,
    porUnidade,
    porSetor,
    porMotivo,
    proximosVencimentosExperiencia,
  };
}
