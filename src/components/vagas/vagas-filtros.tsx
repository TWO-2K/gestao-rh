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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SITUACAO_VAGA_LABEL } from "@/lib/constants";

type Opcao = { id: string; nome: string };

export function VagasFiltros({
  unidades,
  setores,
  somenteLeitura = false,
}: {
  unidades: Opcao[];
  setores: Opcao[];
  somenteLeitura?: boolean;
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
    // Qualquer mudança de filtro invalida a paginação atual.
    if (key !== "pagina") params.delete("pagina");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Buscar por cargo, candidato ou gestor..."
        defaultValue={searchParams.get("busca") ?? ""}
        className="w-80 rounded-md shadow-sm"
        onChange={(e) => {
          const value = e.target.value;
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => setParam("busca", value || null), 400);
        }}
      />
      {!somenteLeitura && (
        <Select
          value={searchParams.get("unidade_id") ?? "todos"}
          onValueChange={(v) => setParam("unidade_id", v)}
        >
          <SelectTrigger className="w-44 rounded-md shadow-sm">
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
      )}

      <Select
        value={searchParams.get("setor_id") ?? "todos"}
        onValueChange={(v) => setParam("setor_id", v)}
      >
        <SelectTrigger className="w-44 rounded-md shadow-sm">
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
        <SelectTrigger className="w-44 rounded-md shadow-sm">
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

      {!somenteLeitura && (
        <Select
          value={searchParams.get("suspensa") ?? "todos"}
          onValueChange={(v) => setParam("suspensa", v)}
        >
          <SelectTrigger className="w-44 rounded-md shadow-sm">
            <SelectValue placeholder="Suspensão">
              {(value: string | null) =>
                value === "sim"
                  ? "Suspensas"
                  : value === "nao"
                    ? "Não suspensas"
                    : "Suspensas e ativas"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Suspensas e ativas</SelectItem>
            <SelectItem value="sim">Suspensas</SelectItem>
            <SelectItem value="nao">Não suspensas</SelectItem>
          </SelectContent>
        </Select>
      )}
      </div>

      {!somenteLeitura && (
        <Tabs
          value={searchParams.get("view") ?? "tabela"}
          onValueChange={(v) => setParam("view", v === "tabela" ? null : v)}
        >
          <TabsList>
            <TabsTrigger value="tabela">Tabela</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
    </div>
  );
}
