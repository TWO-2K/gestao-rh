"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Opcao = { id: string; nome: string };

export function DashboardRecrutadorFiltros({
  recrutadores = [],
  isAdmin = false,
}: {
  recrutadores?: Opcao[];
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      {isAdmin && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Recrutador</Label>
          <Select
            value={searchParams.get("recrutador_id") ?? ""}
            onValueChange={(v) => setParam("recrutador_id", v)}
          >
            <SelectTrigger className="w-full rounded-md shadow-sm sm:w-56">
              <SelectValue placeholder="Selecione um recrutador">
                {(value: string | null) =>
                  recrutadores.find((r) => r.id === value)?.nome ?? "Selecione um recrutador"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {recrutadores.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Período (data de abertura)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="min-w-0 flex-1 rounded-md shadow-sm"
            defaultValue={searchParams.get("data_abertura_de") ?? ""}
            onChange={(e) => setParam("data_abertura_de", e.target.value || null)}
          />
          <span className="text-xs text-muted-foreground">até</span>
          <Input
            type="date"
            className="min-w-0 flex-1 rounded-md shadow-sm"
            defaultValue={searchParams.get("data_abertura_ate") ?? ""}
            onChange={(e) => setParam("data_abertura_ate", e.target.value || null)}
          />
        </div>
      </div>
    </div>
  );
}
