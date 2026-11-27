"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TabValue = "unidades" | "setores" | "cargos" | "horarios_trabalho" | "funcionarios";
const ABAS: TabValue[] = ["unidades", "setores", "cargos", "horarios_trabalho", "funcionarios"];

export function CadastrosTabs({
  unidadesAction,
  setoresAction,
  cargosAction,
  horariosTrabalhoAction,
  funcionariosAction,
  unidadesContent,
  setoresContent,
  cargosContent,
  horariosTrabalhoContent,
  funcionariosContent,
}: {
  unidadesAction: ReactNode;
  setoresAction: ReactNode;
  cargosAction: ReactNode;
  horariosTrabalhoAction: ReactNode;
  funcionariosAction: ReactNode;
  unidadesContent: ReactNode;
  setoresContent: ReactNode;
  cargosContent: ReactNode;
  horariosTrabalhoContent: ReactNode;
  funcionariosContent: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const abaNaUrl = searchParams.get("aba");
  const abaInicial: TabValue = ABAS.includes(abaNaUrl as TabValue)
    ? (abaNaUrl as TabValue)
    : "unidades";
  const [tab, setTabState] = useState<TabValue>(abaInicial);

  function setTab(novaAba: TabValue) {
    setTabState(novaAba);
    const params = new URLSearchParams(searchParams.toString());
    params.set("aba", novaAba);
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
  }

  const actions: Record<TabValue, ReactNode> = {
    unidades: unidadesAction,
    setores: setoresAction,
    cargos: cargosAction,
    horarios_trabalho: horariosTrabalhoAction,
    funcionarios: funcionariosAction,
  };

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="max-w-full overflow-x-auto">
          <TabsList>
            <TabsTrigger value="unidades">Unidades</TabsTrigger>
            <TabsTrigger value="setores">Setores</TabsTrigger>
            <TabsTrigger value="cargos">Cargos</TabsTrigger>
            <TabsTrigger value="horarios_trabalho">Horários de trabalho</TabsTrigger>
            <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          </TabsList>
        </div>
        {actions[tab]}
      </div>

      <TabsContent value="unidades" className="flex flex-col gap-4">
        {unidadesContent}
      </TabsContent>
      <TabsContent value="setores" className="flex flex-col gap-4">
        {setoresContent}
      </TabsContent>
      <TabsContent value="cargos" className="flex flex-col gap-4">
        {cargosContent}
      </TabsContent>
      <TabsContent value="horarios_trabalho" className="flex flex-col gap-4">
        {horariosTrabalhoContent}
      </TabsContent>
      <TabsContent value="funcionarios" className="flex flex-col gap-4">
        {funcionariosContent}
      </TabsContent>
    </Tabs>
  );
}
