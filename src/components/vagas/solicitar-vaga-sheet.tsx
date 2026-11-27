"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SolicitarVagaForm } from "./solicitar-vaga-form";
import type { SolicitarVagaValues } from "@/lib/validators/vaga";

type Opcao = { id: string; nome: string };

export function SolicitarVagaSheet({
  cargos,
  setores,
  horariosTrabalho,
  cargoSetorMap,
  trigger,
  vagaId,
  defaultValues,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  cargos: Opcao[];
  setores: Opcao[];
  horariosTrabalho: Opcao[];
  cargoSetorMap: Record<string, string[]>;
  trigger?: React.ReactElement;
  vagaId?: string;
  defaultValues?: SolicitarVagaValues;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChangeProp ?? setInternalOpen;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger && <SheetTrigger render={trigger} />}
      <SheetContent className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-[34rem]">
        <SheetHeader className="gap-2 px-6 pt-5 pb-2">
          <SheetTitle className="text-lg">
            {vagaId ? "Editar solicitação" : "Solicitar vaga"}
          </SheetTitle>
          <SheetDescription>
            {vagaId
              ? "Altere os dados da sua solicitação enquanto ela ainda estiver em aberto."
              : "Envie um pedido de abertura de vaga para o RH avaliar."}
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-6">
          <SolicitarVagaForm
            cargos={cargos}
            setores={setores}
            horariosTrabalho={horariosTrabalho}
            cargoSetorMap={cargoSetorMap}
            vagaId={vagaId}
            defaultValues={defaultValues}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
