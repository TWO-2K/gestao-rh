import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profile";
import { getMinhasNotificacoes } from "@/lib/data/notificacoes";
import { NotificacoesLista } from "@/components/notificacoes/notificacoes-lista";
import { NotificacoesFiltro } from "@/components/notificacoes/notificacoes-filtro";
import { Skeleton } from "@/components/ui/skeleton";

export default async function NotificacoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const lida = params.lida === "lidas" ? true : params.lida === "nao_lidas" ? false : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Notificações</h1>
      </div>

      <NotificacoesFiltro />

      <Suspense key={String(lida)} fallback={<NotificacoesConteudoSkeleton />}>
        <NotificacoesConteudo lida={lida} />
      </Suspense>
    </div>
  );
}

async function NotificacoesConteudo({ lida }: { lida: boolean | undefined }) {
  const notificacoes = await getMinhasNotificacoes({ lida });

  return (
    <>
      <p className="-mt-2 text-sm text-muted-foreground">
        {notificacoes.length} notificação{notificacoes.length === 1 ? "" : "ões"} encontrada
        {notificacoes.length === 1 ? "" : "s"}
      </p>
      <NotificacoesLista notificacoes={notificacoes} />
    </>
  );
}

function NotificacoesConteudoSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="-mt-2 h-4 w-48" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
