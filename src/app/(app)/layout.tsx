import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profile";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <SidebarProvider>
      <AppSidebar nome={profile.nome} papel={profile.papel} />
      <SidebarInset>
        <SidebarTrigger className="m-2 -mb-1 self-start md:hidden" />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
