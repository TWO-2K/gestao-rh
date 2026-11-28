import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AlertTriangle, Briefcase, CheckCircle2, Clock, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { getCurrentProfile } from "@/lib/data/profile";
import { getRecrutadores } from "@/lib/data/lookups";
import { getMetricasRecrutador, type MetricasRecrutadorFiltro } from "@/lib/data/dashboard-recrutador";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportarVagas } from "@/components/vagas/exportar-vagas";
import { DashboardRecrutadorFiltros } from "@/components/dashboard/dashboard-recrutador-filtros";
import { FechamentosPorMesChart } from "@/components/dashboard/fechamentos-por-mes-chart";
import { MOTIVO_VAGA_LABEL } from "@/lib/constants";

export default async function DesempenhoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.papel === "gestor" || profile.papel === "diretoria") redirect("/vagas");

  const isAdmin = profile.papel === "admin";
  const isRecrutador = !isAdmin;

  const recrutadores = isAdmin ? await getRecrutadores() : [];
  const recrutadorIdValido =
    isAdmin && params.recrutador_id && recrutadores.some((r) => r.id === params.recrutador_id)
      ? params.recrutador_id
      : undefined;
  const recrutadorId = isRecrutador ? profile.id : recrutadorIdValido;

  const filtro = {
    data_abertura_de: params.data_abertura_de,
    data_abertura_ate: params.data_abertura_ate,
  };

  const nomeExibido = isRecrutador
    ? profile.nome
    : recrutadores.find((r) => r.id === recrutadorId)?.nome;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Desempenho</h1>
          <p className="text-sm text-muted-foreground">
            {isRecrutador
              ? "Seu desempenho como recrutador."
              : nomeExibido
                ? `Desempenho de ${nomeExibido}.`
                : "Selecione um recrutador para ver as métricas."}
          </p>
        </div>
      </div>

      <DashboardRecrutadorFiltros recrutadores={recrutadores} isAdmin={isAdmin} />

      {!recrutadorId && isAdmin ? (
        <Alert>
          <Users className="size-4" />
          <AlertTitle>Nenhum recrutador selecionado</AlertTitle>
          <AlertDescription>
            Escolha um recrutador no filtro acima para ver as métricas de desempenho.
          </AlertDescription>
        </Alert>
      ) : (
        <Suspense key={recrutadorId} fallback={<DesempenhoConteudoSkeleton />}>
          <DesempenhoConteudo recrutadorId={recrutadorId!} filtro={filtro} />
        </Suspense>
      )}
    </div>
  );
}

async function DesempenhoConteudo({
  recrutadorId,
  filtro,
}: {
  recrutadorId: string;
  filtro: MetricasRecrutadorFiltro;
}) {
  const metricas = await getMetricasRecrutador(recrutadorId, filtro);

  const kpis = [
    {
      label: "Vagas fechadas no período",
      valor: metricas.totalFechadas,
      icon: CheckCircle2,
      cor: "text-emerald-600",
    },
    {
      label: "Tempo médio de fechamento",
      valor: `${metricas.tempoMedioFechamento} dias`,
      icon: Clock,
      cor: "text-emerald-600",
    },
    {
      label: "SLA cumprido",
      valor: metricas.slaNoPrazoPct !== null ? `${metricas.slaNoPrazoPct}%` : "—",
      icon: ShieldCheck,
      cor: "text-primary",
    },
    {
      label: "Vagas em aberto (atual)",
      valor: metricas.totalAbertasAtual,
      icon: Briefcase,
      cor: "text-primary",
    },
    {
      label: "Em atraso (atual)",
      valor: metricas.totalEmAtrasoAtual,
      icon: AlertTriangle,
      cor: "text-red-600",
    },
    {
      label: "Taxa de sucesso",
      valor: metricas.taxaSucessoPct !== null ? `${metricas.taxaSucessoPct}%` : "—",
      icon: TrendingUp,
      cor: "text-emerald-600",
    },
  ];

  return (
    <>
      <div className="flex justify-end">
        <ExportarVagas vagas={metricas.vagasPeriodo} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
              <kpi.icon className={`size-4 ${kpi.cor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.valor}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Fechamentos por mês</CardTitle>
        </CardHeader>
        <CardContent>
          <FechamentosPorMesChart data={metricas.fechamentosPorMes} />
        </CardContent>
      </Card>

      {metricas.porMotivo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Fechamentos por motivo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6 gap-y-4 sm:gap-8">
            {metricas.porMotivo.map((item) => (
              <div key={item.motivo} className="flex flex-col">
                <span className="text-2xl font-bold">{item.quantidade}</span>
                <span className="text-sm text-muted-foreground">
                  {MOTIVO_VAGA_LABEL[item.motivo] ?? item.motivo}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}

function DesempenhoConteudoSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </>
  );
}
