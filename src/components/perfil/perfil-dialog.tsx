"use client";

import { useEffect, useState } from "react";
import { obterMeuPerfil } from "@/lib/actions/perfil";
import { PAPEL_LABEL } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AssinaturaCard } from "./assinatura-card";

type MeuPerfil = {
  nome: string;
  email: string;
  papel: string;
  assinaturaUrl: string | null;
};

export function PerfilDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [perfil, setPerfil] = useState<MeuPerfil | null>(null);

  function carregar() {
    obterMeuPerfil().then((dados) => setPerfil(dados));
  }

  useEffect(() => {
    if (open) carregar();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Meu perfil</DialogTitle>
          <DialogDescription>Seus dados de acesso ao sistema.</DialogDescription>
        </DialogHeader>

        {perfil && (
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5 text-sm">
              <p>
                <span className="text-muted-foreground">Nome: </span>
                {perfil.nome}
              </p>
              <p>
                <span className="text-muted-foreground">E-mail: </span>
                {perfil.email}
              </p>
              <p>
                <span className="text-muted-foreground">Papel: </span>
                {PAPEL_LABEL[perfil.papel] ?? perfil.papel}
              </p>
            </div>

            <AssinaturaCard assinaturaUrl={perfil.assinaturaUrl} onChanged={carregar} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
