"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, FolderCog, LayoutDashboard, Settings, Users } from "lucide-react";
import { MARCA } from "@/lib/constants";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificacaoBell } from "@/components/layout/notificacao-bell";
import { Separator } from "@/components/ui/separator";
import type { Tables } from "@/types/database";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  somenteAdmin?: boolean;
  hideFromGestor?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Painel de Gestão", icon: LayoutDashboard, hideFromGestor: true },
  { href: "/vagas", label: "Vagas", icon: Briefcase },
  { href: "/cadastros", label: "Cadastros", icon: FolderCog, adminOnly: true, hideFromGestor: true },
  { href: "/usuarios", label: "Usuários", icon: Users, adminOnly: true, hideFromGestor: true },
  {
    href: "/configuracoes",
    label: "Configurações",
    icon: Settings,
    somenteAdmin: true,
    hideFromGestor: true,
  },
];

type Notificacao = Pick<
  Tables<"notificacoes">,
  "id" | "tipo" | "titulo" | "mensagem" | "vaga_id" | "lida" | "lida_em" | "created_at"
>;

export function AppSidebar({
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
  const pathname = usePathname();
  const isGestor = papel === "gestor";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2">
          <Image
            src={logoUrl}
            alt={MARCA.nome}
            width={32}
            height={32}
            unoptimized
            className="h-8 w-8 shrink-0 object-contain"
          />
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">{MARCA.nome}</span>
            <span className="text-xs text-muted-foreground">RH · Mapa de Vagas</span>
          </div>
        </div>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.filter(
                (item) =>
                  (!item.adminOnly || papel === "admin" || papel === "diretoria") &&
                  (!item.somenteAdmin || papel === "admin") &&
                  (!isGestor || !item.hideFromGestor)
              ).map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <Separator />
      <SidebarFooter className="px-3 py-3">
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:flex-col">
          <UserMenu nome={nome} papel={papel} />
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col">
            <NotificacaoBell notificacoes={notificacoes} contagemNaoLida={contagemNaoLida} />
            <ModeToggle />
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
