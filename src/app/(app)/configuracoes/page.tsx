import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profile";
import { getAppConfig, getUsuariosComPushAtivo } from "@/lib/data/config";
import { getConfigTiposNotificacao } from "@/lib/data/notificacoes";
import { LogoConfigCard } from "@/components/configuracoes/logo-config-card";
import { PushUsuariosCard } from "@/components/configuracoes/push-usuarios-card";
import { NotificacaoTiposCard } from "@/components/configuracoes/notificacao-tipos-card";
import { Skeleton } from "@/components/ui/skeleton";

export default async function ConfiguracoesPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.papel !== "admin") {
    redirect("/vagas");
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Preferências gerais do sistema, válidas para todos os usuários.
        </p>
      </div>

      <Suspense fallback={<ConfiguracoesConteudoSkeleton />}>
        <ConfiguracoesConteudo />
      </Suspense>
    </div>
  );
}

async function ConfiguracoesConteudo() {
  const [{ logoUrl }, usuariosComPush, tiposNotificacao] = await Promise.all([
    getAppConfig(),
    getUsuariosComPushAtivo(),
    getConfigTiposNotificacao(),
  ]);

  return (
    <>
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Aparência</h2>
        <div className="md:max-w-md">
          <LogoConfigCard logoUrl={logoUrl} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Notificações</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <NotificacaoTiposCard tipos={tiposNotificacao} />
          <PushUsuariosCard usuarios={usuariosComPush} />
        </div>
      </div>
    </>
  );
}

function ConfiguracoesConteudoSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-32 w-full md:max-w-md" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}
