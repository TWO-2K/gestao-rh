import { AlertTriangle, Briefcase, Clock, Hourglass, PauseCircle } from "lucide-react";
import { getDashboardData } from "@/lib/data/dashboard";
import { getCurrentProfile } from "@/lib/data/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOTIVO_VAGA_LABEL } from "@/lib/constants";
import { VagasPorUnidadeChart } from "@/components/dashboard/vagas-por-unidade-chart";
import { VagasPorSetorChart } from "@/components/dashboard/vagas-por-setor-chart";
import { ExportarVagas } from "@/components/vagas/exportar-vagas";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

function formatarData(data: string | null) {
  if (!data) return "—";
  return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
}

export default async function DashboardPage() {
  const dados = await getDashboardData();
  const profile = await getCurrentProfile();
  const isAdmin = profile?.papel === "admin" || profile?.papel === "diretoria";

  const kpis = [
    ...(isAdmin
      ? [
          {
            label: "Pendentes de aprovação",
            valor: dados.totalPendentesAprovacao,
            icon: Hourglass,
            cor: "text-amber-600",
          },
        ]
      : []),
    {
      label: "Vagas abertas",
      valor: dados.totalAbertas,
      icon: Briefcase,
      cor: "text-primary",
    },
    {
      label: "Em atraso (SLA estourado)",
      valor: dados.totalEmAtraso,
      icon: AlertTriangle,
      cor: "text-red-600",
    },
    {
      label: "Suspensas",
      valor: dados.totalSuspensas,
      icon: PauseCircle,
      cor: "text-amber-600",
    },
    {
      label: "Tempo médio de fechamento",
      valor: `${dados.tempoMedioFechamento} dias`,
      icon: Clock,
      cor: "text-emerald-600",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Painel de Gestão</h1>
          <p className="text-sm text-muted-foreground">
            Visão consolidada de todas as unidades do Grupo +B.
          </p>
        </div>
        <ExportarVagas vagas={dados.vagas} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Vagas abertas por unidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VagasPorUnidadeChart data={dados.porUnidade} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Vagas abertas por setor (top 8)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VagasPorSetorChart data={dados.porSetor} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Vagas abertas por motivo</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-8">
          {dados.porMotivo.map((item) => (
            <div key={item.motivo} className="flex flex-col">
              <span className="text-2xl font-bold">{item.quantidade}</span>
              <span className="text-sm text-muted-foreground">
                {MOTIVO_VAGA_LABEL[item.motivo] ?? item.motivo}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {dados.proximosVencimentosExperiencia.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Períodos de experiência vencendo nos próximos 15 dias
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {dados.proximosVencimentosExperiencia.map((v) => (
              <Alert key={v.id}>
                <Clock className="size-4" />
                <AlertTitle>
                  {v.candidato} — {v.cargo} ({v.unidade})
                </AlertTitle>
                <AlertDescription>
                  1º período: {formatarData(v.periodo_experiencia_1)} · 2º período:{" "}
                  {formatarData(v.periodo_experiencia_2)}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
