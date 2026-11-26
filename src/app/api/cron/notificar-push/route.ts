import { NextRequest, NextResponse } from "next/server";
import { enviarPush } from "@/lib/push";

/**
 * Chamado só pelo trigger fn_notificar_push_notificacao (pg_net, via
 * supabase/migrations/20261125000006_notificacao_push_webhook.sql) quando o
 * job de vencimento de experiência cria uma notificação — essa é a única
 * notificação do app que nasce dentro do Postgres (pg_cron), então é a única
 * que não tem um server action no mesmo request para disparar o enviarPush.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { destinatario_id, titulo, mensagem, url } = body as {
    destinatario_id?: string;
    titulo?: string;
    mensagem?: string;
    url?: string;
  };

  if (!destinatario_id || !titulo || !mensagem) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  await enviarPush(destinatario_id, { titulo, mensagem, url });
  return NextResponse.json({ ok: true });
}
