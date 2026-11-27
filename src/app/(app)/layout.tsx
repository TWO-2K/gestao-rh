import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profile";
import { getMinhasNotificacoes, getContagemNaoLidas } from "@/lib/data/notificacoes";
import { getLogoUrl } from "@/lib/data/config";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { InstallPwaCard } from "@/components/layout/install-pwa-card";
import { MobileTopBar } from "@/components/layout/mobile-top-bar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { NotificacaoBell } from "@/components/layout/notificacao-bell";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

async function NotificacaoBellSection() {
  const [notificacoes, contagemNaoLida] = await Promise.all([
    getMinhasNotificacoes(),
    getContagemNaoLidas(),
  ]);

  return <NotificacaoBell notificacoes={notificacoes} contagemNaoLida={contagemNaoLida} />;
}

function NotificacaoBellSkeleton() {
  return <Skeleton className="size-8 rounded-full" />;
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const logoUrl = await getLogoUrl();

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar
        nome={profile.nome}
        papel={profile.papel}
        notificacoesSlot={
          <Suspense fallback={<NotificacaoBellSkeleton />}>
            <NotificacaoBellSection />
          </Suspense>
        }
        logoUrl={logoUrl}
      />
      <SidebarInset className="h-svh overflow-hidden">
        <MobileTopBar
          nome={profile.nome}
          papel={profile.papel}
          notificacoesSlot={
            <Suspense fallback={<NotificacaoBellSkeleton />}>
              <NotificacaoBellSection />
            </Suspense>
          }
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
