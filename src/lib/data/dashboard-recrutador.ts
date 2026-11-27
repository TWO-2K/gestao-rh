import { getVagasParaExportar } from "@/lib/data/vagas";

export type MetricasRecrutadorFiltro = {
  data_abertura_de?: string;
  data_abertura_ate?: string;
};

export async function getMetricasRecrutador(
  recrutadorId: string,
  filtro: MetricasRecrutadorFiltro = {}
) {
  const temFiltroPeriodo = Boolean(filtro.data_abertura_de || filtro.data_abertura_ate);

  // "Todas" é o snapshot atual (sem filtro de data), usado só para o que está
  // em aberto agora — uma vaga aberta antes do período escolhido mas ainda em
  // aberto hoje não pode desaparecer dessa contagem.
  const todas = await getVagasParaExportar({ recrutador_id: recrutadorId });
  const periodo = temFiltroPeriodo
    ? await getVagasParaExportar({ recrutador_id: recrutadorId, ...filtro })
    : todas;

  const abertas = todas.filter((v) => v.situacao === "em_aberto");
  const fechadas = periodo.filter((v) => v.situacao === "fechado");
  const canceladas = periodo.filter((v) => v.situacao === "cancelado");
  const rejeitadas = periodo.filter((v) => v.situacao === "rejeitado");

  const tempoMedioFechamento =
    fechadas.length > 0
      ? Math.round(
          fechadas.reduce((acc, v) => acc + (v.dias_em_aberto ?? 0), 0) / fechadas.length
        )
      : 0;

  const slaNoPrazo = fechadas.filter((v) => v.status_sla === "no_prazo").length;
  const slaEmAtraso = fechadas.filter((v) => v.status_sla === "em_atraso").length;
  const slaBase = slaNoPrazo + slaEmAtraso;
  const slaNoPrazoPct = slaBase > 0 ? Math.round((slaNoPrazo / slaBase) * 100) : null;

  const totalSucessoBase = fechadas.length + canceladas.length + rejeitadas.length;
  const taxaSucessoPct =
    totalSucessoBase > 0 ? Math.round((fechadas.length / totalSucessoBase) * 100) : null;

  const fechamentosPorMes = Object.values(
    fechadas.reduce<Record<string, { mes: string; quantidade: number }>>((acc, v) => {
      if (!v.data_fechamento) return acc;
      const mes = v.data_fechamento.slice(0, 7);
      acc[mes] ??= { mes, quantidade: 0 };
      acc[mes].quantidade += 1;
      return acc;
    }, {})
  )
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .map((item) => ({
      ...item,
      label: new Date(item.mes + "-01T00:00:00").toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      }),
    }));

  const porMotivo = Object.values(
    fechadas.reduce<Record<string, { motivo: string; quantidade: number }>>((acc, v) => {
      acc[v.motivo] ??= { motivo: v.motivo, quantidade: 0 };
      acc[v.motivo].quantidade += 1;
      return acc;
    }, {})
  );

  return {
    vagasPeriodo: periodo,
    totalFechadas: fechadas.length,
    tempoMedioFechamento,
    slaNoPrazo,
    slaEmAtraso,
    slaNoPrazoPct,
    totalAbertasAtual: abertas.length,
    totalEmAtrasoAtual: abertas.filter((v) => v.status_sla === "em_atraso").length,
    taxaSucessoPct,
    fechamentosPorMes,
    porMotivo,
  };
}
