"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { MOTIVO_VAGA_LABEL, SITUACAO_VAGA_LABEL, STATUS_SLA_LABEL } from "@/lib/constants";

type Opcao = { id: string; nome: string };

export function VagasFiltros({
  unidades,
  setores,
  cargos = [],
  horariosTrabalho = [],
  gestores = [],
  recrutadores = [],
  somenteLeitura = false,
  isRecrutador = false,
  isAdmin = false,
}: {
  unidades: Opcao[];
  setores: Opcao[];
  cargos?: Opcao[];
  horariosTrabalho?: Opcao[];
  gestores?: Opcao[];
  recrutadores?: Opcao[];
  somenteLeitura?: boolean;
  isRecrutador?: boolean;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [drawerAberto, setDrawerAberto] = useState(false);

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

  function limparFiltros() {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of [
      "unidade_id",
      "setor_id",
      "cargo_id",
      "motivo",
      "horario_trabalho_id",
      "gestor_id",
      "situacao",
      "status_sla",
      "suspensa",
      "minhas",
      "recrutador_id",
      "data_abertura_de",
      "data_abertura_ate",
      "pagina",
    ]) {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const filtrosAtivos = [
    searchParams.get("unidade_id"),
    searchParams.get("setor_id"),
    searchParams.get("cargo_id"),
    searchParams.get("motivo"),
    searchParams.get("horario_trabalho_id"),
    searchParams.get("gestor_id"),
    searchParams.get("situacao"),
    searchParams.get("status_sla"),
    searchParams.get("suspensa"),
    searchParams.get("recrutador_id"),
    searchParams.get("data_abertura_de"),
    searchParams.get("data_abertura_ate"),
  ].filter((v) => v && v !== "todos").length;

  const apenasMinhas = searchParams.get("minhas") === "sim";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          placeholder="Buscar por cargo, candidato ou gestor..."
          defaultValue={searchParams.get("busca") ?? ""}
          className="w-full rounded-md shadow-sm sm:w-80"
          onChange={(e) => {
            const value = e.target.value;
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => setParam("busca", value || null), 400);
          }}
        />

        {isRecrutador && (
          <Button
            variant={apenasMinhas ? "default" : "outline"}
            className="rounded-md shadow-sm"
            onClick={() => setParam("minhas", apenasMinhas ? null : "sim")}
          >
            Minhas vagas
          </Button>
        )}

        <Sheet open={drawerAberto} onOpenChange={setDrawerAberto}>
          <SheetTrigger
            render={
              <Button variant="outline" className="gap-2 rounded-md shadow-sm" />
            }
          >
            <SlidersHorizontal className="size-4" />
            Filtros
            {filtrosAtivos > 0 && <Badge className="bg-foreground text-background">{filtrosAtivos}</Badge>}
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4">
              {!somenteLeitura && (
                <div className="flex flex-col gap-1.5">
                  <Select
                    value={searchParams.get("unidade_id") ?? "todos"}
                    onValueChange={(v) => setParam("unidade_id", v)}
                  >
                    <SelectTrigger className="w-full rounded-md shadow-sm">
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
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Select
                  value={searchParams.get("setor_id") ?? "todos"}
                  onValueChange={(v) => setParam("setor_id", v)}
                >
                  <SelectTrigger className="w-full rounded-md shadow-sm">
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
              </div>

              <div className="flex flex-col gap-1.5">
                <Select
                  value={searchParams.get("cargo_id") ?? "todos"}
                  onValueChange={(v) => setParam("cargo_id", v)}
                >
                  <SelectTrigger className="w-full rounded-md shadow-sm">
                    <SelectValue placeholder="Cargo">
                      {(value: string | null) =>
                        value && value !== "todos"
                          ? cargos.find((c) => c.id === value)?.nome ?? "Cargo"
                          : "Todos os cargos"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os cargos</SelectItem>
                    {cargos.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Select
                  value={searchParams.get("horario_trabalho_id") ?? "todos"}
                  onValueChange={(v) => setParam("horario_trabalho_id", v)}
                >
                  <SelectTrigger className="w-full rounded-md shadow-sm">
                    <SelectValue placeholder="Horário de trabalho">
                      {(value: string | null) =>
                        value && value !== "todos"
                          ? horariosTrabalho.find((h) => h.id === value)?.nome ?? "Horário de trabalho"
                          : "Todos os horários"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os horários</SelectItem>
                    {horariosTrabalho.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!somenteLeitura && (
                <div className="flex flex-col gap-1.5">
                  <Select
                    value={searchParams.get("gestor_id") ?? "todos"}
                    onValueChange={(v) => setParam("gestor_id", v)}
                  >
                    <SelectTrigger className="w-full rounded-md shadow-sm">
                      <SelectValue placeholder="Gestor solicitante">
                        {(value: string | null) =>
                          value && value !== "todos"
                            ? gestores.find((g) => g.id === value)?.nome ?? "Gestor solicitante"
                            : "Todos os gestores"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os gestores</SelectItem>
                      {gestores.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Select
                  value={searchParams.get("motivo") ?? "todos"}
                  onValueChange={(v) => setParam("motivo", v)}
                >
                  <SelectTrigger className="w-full rounded-md shadow-sm">
                    <SelectValue placeholder="Motivo">
                      {(value: string | null) =>
                        value && value !== "todos"
                          ? MOTIVO_VAGA_LABEL[value] ?? "Motivo"
                          : "Todos os motivos"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os motivos</SelectItem>
                    {Object.entries(MOTIVO_VAGA_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Select
                  value={searchParams.get("situacao") ?? "todos"}
                  onValueChange={(v) => setParam("situacao", v)}
                >
                  <SelectTrigger className="w-full rounded-md shadow-sm">
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

              {isAdmin && (
                <div className="flex flex-col gap-1.5">
                  <Select
                    value={searchParams.get("recrutador_id") ?? "todos"}
                    onValueChange={(v) => setParam("recrutador_id", v)}
                  >
                    <SelectTrigger className="w-full rounded-md shadow-sm">
                      <SelectValue placeholder="Recrutador">
                        {(value: string | null) =>
                          value && value !== "todos"
                            ? recrutadores.find((r) => r.id === value)?.nome ?? "Recrutador"
                            : "Todos os recrutadores"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os recrutadores</SelectItem>
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
                <Select
                  value={searchParams.get("status_sla") ?? "todos"}
                  onValueChange={(v) => setParam("status_sla", v)}
                >
                  <SelectTrigger className="w-full rounded-md shadow-sm">
                    <SelectValue placeholder="Status do SLA">
                      {(value: string | null) =>
                        value && value !== "todos"
                          ? STATUS_SLA_LABEL[value] ?? "Status do SLA"
                          : "Qualquer status de SLA"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Qualquer status de SLA</SelectItem>
                    {Object.entries(STATUS_SLA_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!somenteLeitura && (
                <div className="flex flex-col gap-1.5">
                  <Select
                    value={searchParams.get("suspensa") ?? "todos"}
                    onValueChange={(v) => setParam("suspensa", v)}
                  >
                    <SelectTrigger className="w-full rounded-md shadow-sm">
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
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Data de abertura</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    className="rounded-md shadow-sm"
                    defaultValue={searchParams.get("data_abertura_de") ?? ""}
                    onChange={(e) => setParam("data_abertura_de", e.target.value || null)}
                  />
                  <span className="text-xs text-muted-foreground">até</span>
                  <Input
                    type="date"
                    className="rounded-md shadow-sm"
                    defaultValue={searchParams.get("data_abertura_ate") ?? ""}
                    onChange={(e) => setParam("data_abertura_ate", e.target.value || null)}
                  />
                </div>
              </div>
            </div>

            <SheetFooter>
              <SheetClose render={<Button variant="outline" onClick={limparFiltros} />}>
                Limpar filtros
              </SheetClose>
              <SheetClose render={<Button />}>Aplicar</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {!somenteLeitura && (
        <Tabs
          value={searchParams.get("view") ?? "kanban"}
          onValueChange={(v) => setParam("view", v === "kanban" ? null : v)}
        >
          <TabsList>
            <TabsTrigger value="tabela">Tabela</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      </div>
    </div>
  );
}
