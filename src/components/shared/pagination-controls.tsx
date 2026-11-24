"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PaginationControls({
  paginaAtual,
  totalPaginas,
  paramName = "pagina",
}: {
  paginaAtual: number;
  totalPaginas: number;
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPaginas <= 1) return null;

  function irPara(pagina: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (pagina <= 1) {
      params.delete(paramName);
    } else {
      params.set(paramName, String(pagina));
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const paginas = paginasVisiveis(paginaAtual, totalPaginas);

  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <p className="text-xs text-muted-foreground">
        Página {paginaAtual} de {totalPaginas}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={paginaAtual <= 1}
          onClick={() => irPara(paginaAtual - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>

        {paginas.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === paginaAtual ? "default" : "outline"}
              size="icon-sm"
              onClick={() => irPara(p)}
            >
              {p}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="icon-sm"
          disabled={paginaAtual >= totalPaginas}
          onClick={() => irPara(paginaAtual + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function paginasVisiveis(atual: number, total: number): (number | "...")[] {
  const janela = 1;
  const paginas: (number | "...")[] = [];

  for (let p = 1; p <= total; p++) {
    const dentroDaJanela = Math.abs(p - atual) <= janela;
    const extremidade = p === 1 || p === total;
    if (dentroDaJanela || extremidade) {
      paginas.push(p);
    } else if (paginas[paginas.length - 1] !== "...") {
      paginas.push("...");
    }
  }

  return paginas;
}
