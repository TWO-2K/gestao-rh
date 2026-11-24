"use client";

import { useState } from "react";
import { CheckCircle2, PenLine, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { removerMinhaAssinatura } from "@/lib/actions/perfil";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AssinaturaPadDialog } from "./assinatura-pad-dialog";

export function AssinaturaCard({
  assinaturaUrl,
  onChanged,
}: {
  assinaturaUrl: string | null;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [removendo, setRemovendo] = useState(false);

  async function handleRemover() {
    setRemovendo(true);
    const result = await removerMinhaAssinatura();
    setRemovendo(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Assinatura removida");
    onChanged();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Minha assinatura</CardTitle>
        <CardDescription>
          Cadastre sua assinatura para uso em documentos do sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {assinaturaUrl ? (
          <>
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="size-4" />
              Assinatura cadastrada
            </div>
            <div className="w-fit rounded-xl border border-dashed bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assinaturaUrl} alt="Assinatura" className="h-24" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(true)}>
                <PenLine className="size-4" />
                Refazer assinatura
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleRemover}
                disabled={removendo}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
                {removendo ? "Removendo..." : "Remover"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="size-4" />
              Assinatura não cadastrada
            </div>
            <Button type="button" onClick={() => setOpen(true)} className="w-fit">
              <PenLine className="size-4" />
              Cadastrar assinatura
            </Button>
          </>
        )}
      </CardContent>

      <AssinaturaPadDialog open={open} onOpenChange={setOpen} onSaved={onChanged} />
    </Card>
  );
}
