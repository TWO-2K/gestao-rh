"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { filtrarNavItems } from "@/components/layout/app-sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const MAX_VISIVEL = 4;

export function MobileBottomNav({ papel }: { papel: string }) {
  const pathname = usePathname();
  const [abertoMais, setAbertoMais] = useState(false);
  const itens = filtrarNavItems(papel);
  const temMais = itens.length > MAX_VISIVEL;
  const visiveis = temMais ? itens.slice(0, MAX_VISIVEL - 1) : itens;
  const ocultos = temMais ? itens.slice(MAX_VISIVEL - 1) : [];

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-14 shrink-0 items-center border-t border-sidebar-border bg-sidebar md:hidden">
        {visiveis.map((item) => {
          const ativo = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
                ativo ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5" />
              <span className="truncate px-1">{item.label}</span>
            </Link>
          );
        })}
        {temMais && (
          <button
            type="button"
            onClick={() => setAbertoMais(true)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-muted-foreground"
          >
            <MoreHorizontal className="size-5" />
            <span>Mais</span>
          </button>
        )}
      </nav>
      {temMais && (
        <Sheet open={abertoMais} onOpenChange={setAbertoMais}>
          <SheetContent side="bottom" className="md:hidden">
            <SheetHeader>
              <SheetTitle>Mais opções</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 gap-3 px-4 pb-6">
              {ocultos.map((item) => {
                const ativo = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setAbertoMais(false)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-lg py-3 text-[11px]",
                      ativo ? "bg-accent text-primary" : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="size-5" />
                    <span className="truncate px-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
