"use client";

import { useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SITUACAO_VAGA_LABEL } from "@/lib/constants";

type Opcao = { id: string; nome: string };

export function VagasFiltros({
  unidades,
  setores,
}: {
  unidades: Opcao[];
  setores: Opcao[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "todos") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-3">
      <Input
        placeholder="Buscar por cargo, candidato ou gestor..."
        defaultValue={searchParams.get("busca") ?? ""}
        className="w-64"
        onChange={(e) => {
          const value = e.target.value;
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => setParam("busca", value || null), 400);
        }}
      />
      <Select
        value={searchParams.get("unidade_id") ?? "todos"}
        onValueChange={(v) => setParam("unidade_id", v)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Unidade">
            {(value: string | null) =>
              value && value !== "todos"
                ? unidades.find((u) => u.id === value)?.nome ?? "Unidade"
                : "Todas as unidades"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas as unidades</SelectItem>
          {unidades.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("setor_id") ?? "todos"}
        onValueChange={(v) => setParam("setor_id", v)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Setor">
            {(value: string | null) =>
              value && value !== "todos"
                ? setores.find((s) => s.id === value)?.nome ?? "Setor"
                : "Todos os setores"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os setores</SelectItem>
          {setores.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("situacao") ?? "todos"}
        onValueChange={(v) => setParam("situacao", v)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Situação">
            {(value: string | null) =>
              value && value !== "todos"
                ? SITUACAO_VAGA_LABEL[value] ?? "Situação"
                : "Todas as situações"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas as situações</SelectItem>
          {Object.entries(SITUACAO_VAGA_LABEL).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
