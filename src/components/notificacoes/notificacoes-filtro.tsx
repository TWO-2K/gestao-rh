"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function NotificacoesFiltro() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setLida(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "todas") {
      params.delete("lida");
    } else {
      params.set("lida", value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Tabs value={searchParams.get("lida") ?? "todas"} onValueChange={setLida}>
      <TabsList>
        <TabsTrigger value="todas">Todas</TabsTrigger>
        <TabsTrigger value="nao_lidas">Não lidas</TabsTrigger>
        <TabsTrigger value="lidas">Lidas</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
