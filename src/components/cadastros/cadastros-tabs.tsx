"use client";

import { type ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TabValue = "unidades" | "setores" | "cargos" | "funcionarios";
const ABAS: TabValue[] = ["unidades", "setores", "cargos", "funcionarios"];

export function CadastrosTabs({
  unidadesAction,
  setoresAction,
  cargosAction,
  funcionariosAction,
  unidadesContent,
  setoresContent,
  cargosContent,
  funcionariosContent,
}: {
  unidadesAction: ReactNode;
  setoresAction: ReactNode;
  cargosAction: ReactNode;
  funcionariosAction: ReactNode;
  unidadesContent: ReactNode;
  setoresContent: ReactNode;
  cargosContent: ReactNode;
  funcionariosContent: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const abaNaUrl = searchParams.get("aba");
  const tab: TabValue = ABAS.includes(abaNaUrl as TabValue) ? (abaNaUrl as TabValue) : "unidades";

  function setTab(novaAba: TabValue) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("aba", novaAba);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const actions: Record<TabValue, ReactNode> = {
    unidades: unidadesAction,
    setores: setoresAction,
    cargos: cargosAction,
    funcionarios: funcionariosAction,
  };

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
      <div className="flex items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="unidades">Unidades</TabsTrigger>
          <TabsTrigger value="setores">Setores</TabsTrigger>
          <TabsTrigger value="cargos">Cargos</TabsTrigger>
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
        </TabsList>
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
      <TabsContent value="funcionarios" className="flex flex-col gap-4">
        {funcionariosContent}
      </TabsContent>
    </Tabs>
  );
}
