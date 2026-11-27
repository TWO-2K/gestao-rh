import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profile";
import { getMinhasNotificacoes, getContagemNaoLidas } from "@/lib/data/notificacoes";
import { getLogoUrl } from "@/lib/data/config";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { InstallPwaCard } from "@/components/layout/install-pwa-card";
import { MobileTopBar } from "@/components/layout/mobile-top-bar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [notificacoes, contagemNaoLida, logoUrl] = await Promise.all([
    getMinhasNotificacoes(),
    getContagemNaoLidas(),
    getLogoUrl(),
  ]);

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar
        nome={profile.nome}
        papel={profile.papel}
        notificacoes={notificacoes}
        contagemNaoLida={contagemNaoLida}
        logoUrl={logoUrl}
      />
      <SidebarInset className="h-svh overflow-hidden">
        <MobileTopBar
          nome={profile.nome}
          papel={profile.papel}
          notificacoes={notificacoes}
          contagemNaoLida={contagemNaoLida}
          logoUrl={logoUrl}
        />
        <main className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-20 md:px-6 md:py-6 md:pb-6">
          {children}
        </main>
        <MobileBottomNav papel={profile.papel} />
      </SidebarInset>
      <InstallPwaCard />
    </SidebarProvider>
  );
}
