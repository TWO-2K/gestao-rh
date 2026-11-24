import { Badge } from "@/components/ui/badge";

export function diasRestantes(data: string | null) {
  if (!data) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(data + "T00:00:00");
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

export function AlertaExperiencia({ data }: { data: string | null }) {
  const dias = diasRestantes(data);
  if (dias === null) return null;

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
  return null;
}
