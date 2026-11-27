"use client";

import Image from "next/image";
import { MARCA } from "@/lib/constants";
import { InstallPwaButton } from "@/components/layout/install-pwa-button";
import { NotificacaoBell } from "@/components/layout/notificacao-bell";
import { UserMenu } from "@/components/layout/user-menu";
import type { Tables } from "@/types/database";

type Notificacao = Pick<
  Tables<"notificacoes">,
  "id" | "tipo" | "titulo" | "mensagem" | "vaga_id" | "lida" | "lida_em" | "created_at"
>;

export function MobileTopBar({
  nome,
  papel,
  notificacoes,
  contagemNaoLida,
  logoUrl,
}: {
  nome: string;
  papel: string;
  notificacoes: Notificacao[];
  contagemNaoLida: number;
  logoUrl: string;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground md:hidden">
      <div className="flex items-center gap-2 overflow-hidden">
        <Image
          src={logoUrl}
          alt={MARCA.nome}
          width={28}
          height={28}
          unoptimized
          className="size-7 shrink-0 object-contain"
        />
        <span className="truncate text-sm font-semibold">{MARCA.nome}</span>
      </div>
      <div className="flex items-center gap-1">
        <InstallPwaButton />
        <NotificacaoBell notificacoes={notificacoes} contagemNaoLida={contagemNaoLida} />
        <UserMenu nome={nome} papel={papel} />
      </div>
    </header>
  );
}
