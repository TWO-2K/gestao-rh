import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_EXPERIENCIA_BADGE_VARIANT, STATUS_EXPERIENCIA_LABEL } from "@/lib/constants";
import type { StatusExperiencia } from "@/types/database";

export function diasRestantes(data: string | null) {
  if (!data) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(data + "T00:00:00");
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

function formatarData(data: string) {
  return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
}

// Enquanto o 1º período não for marcado, é ele que aparece. Se for
// reprovado, a experiência já terminou ali — não existe 2º período pra
// acompanhar. Só quando o 1º é aprovado é que passa a mostrar o 2º.
export function periodoExperienciaAtivo(vaga: {
  periodo_experiencia_1: string | null;
  periodo_experiencia_2: string | null;
  experiencia_1_status: StatusExperiencia;
  experiencia_2_status: StatusExperiencia;
}) {
  if (vaga.experiencia_1_status === "reprovado") {
    return { data: vaga.periodo_experiencia_1, status: vaga.experiencia_1_status };
  }
  if (vaga.experiencia_1_status === "pendente") {
    return { data: vaga.periodo_experiencia_1, status: vaga.experiencia_1_status };
  }
  return { data: vaga.periodo_experiencia_2, status: vaga.experiencia_2_status };
}

export function AlertaExperiencia({
  data,
  status = "pendente",
}: {
  data: string | null;
  status?: StatusExperiencia;
}) {
  if (status !== "pendente") {
    return (
      <Badge variant="outline" className={cn("border", STATUS_EXPERIENCIA_BADGE_VARIANT[status])}>
        {STATUS_EXPERIENCIA_LABEL[status]}
      </Badge>
    );
  }

  const dias = diasRestantes(data);
  if (dias === null || data === null) return null;

  if (dias < 0) {
    return (
      <Badge variant="outline" className="border bg-red-600 text-white border-red-600 dark:bg-red-500 dark:border-red-500">
        Venceu há {Math.abs(dias)} {Math.abs(dias) === 1 ? "dia" : "dias"}
      </Badge>
    );
  }
  if (dias <= 7) {
    return (
      <Badge variant="outline" className="border bg-amber-500 text-white border-amber-500 dark:bg-amber-500 dark:border-amber-500">
        Vence em {dias} {dias === 1 ? "dia" : "dias"}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      {formatarData(data)}
    </Badge>
  );
}
