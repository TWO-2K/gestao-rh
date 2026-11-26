import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profile";
import { getMinhasNotificacoes } from "@/lib/data/notificacoes";
import { NotificacoesLista } from "@/components/notificacoes/notificacoes-lista";
import { NotificacoesFiltro } from "@/components/notificacoes/notificacoes-filtro";

export default async function NotificacoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const lida = params.lida === "lidas" ? true : params.lida === "nao_lidas" ? false : undefined;
  const notificacoes = await getMinhasNotificacoes({ lida });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Notificações</h1>
        <p className="text-sm text-muted-foreground">
          {notificacoes.length} notificação{notificacoes.length === 1 ? "" : "ões"} encontrada
          {notificacoes.length === 1 ? "" : "s"}
        </p>
      </div>

      <NotificacoesFiltro />
      <NotificacoesLista notificacoes={notificacoes} />
    </div>
  );
}
