"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, FolderCog, LayoutDashboard, Settings, TrendingUp, Users } from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { ModeToggle } from "@/components/mode-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { InstallPwaButton } from "@/components/layout/install-pwa-button";
import { Separator } from "@/components/ui/separator";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  somenteAdmin?: boolean;
  hideFromGestor?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Painel de Gestão", icon: LayoutDashboard, hideFromGestor: true },
  { href: "/desempenho", label: "Desempenho", icon: TrendingUp, hideFromGestor: true },
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

export function filtrarNavItems(papel: string): NavItem[] {
  const isGestor = papel === "gestor";
  return NAV_ITEMS.filter(
    (item) =>
      (!item.adminOnly || papel === "admin" || papel === "diretoria") &&
      (!item.somenteAdmin || papel === "admin") &&
      (!isGestor || !item.hideFromGestor)
  );
}

export function AppSidebar({
  nome,
  papel,
  notificacoesSlot,
  logoUrl,
}: {
  nome: string;
  papel: string;
  notificacoesSlot: React.ReactNode;
  logoUrl: string;
}) {
  const pathname = usePathname();
  const { setOpen } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <Sidebar
      collapsible="icon"
      onMouseEnter={isMobile ? undefined : () => setOpen(true)}
      onMouseLeave={isMobile ? undefined : () => setOpen(false)}
    >
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
          <div className="flex min-w-0 max-w-40 flex-col overflow-hidden leading-tight opacity-100 transition-[max-width,opacity] duration-300 ease-in-out group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
            <span className="text-sm font-semibold whitespace-nowrap">{MARCA.nome}</span>
            <span className="text-xs whitespace-nowrap text-muted-foreground">RH · Mapa de Vagas</span>
          </div>
        </div>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filtrarNavItems(papel).map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="truncate opacity-100 transition-opacity duration-200 ease-in-out group-data-[collapsible=icon]:opacity-0">
                      {item.label}
                    </span>
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
            {notificacoesSlot}
            <InstallPwaButton />
            <ModeToggle />
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
