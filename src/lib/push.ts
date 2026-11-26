import { setVapidDetails, sendNotification } from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PapelUsuario } from "@/types/database";

let configurado = false;

function garantirConfiguracao() {
  if (configurado) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return;

  setVapidDetails(subject, publicKey, privateKey);
  configurado = true;
}

async function enviarParaSubscriptions(
  admin: ReturnType<typeof createAdminClient>,
  subscriptions: { id: string; endpoint: string; p256dh: string; auth: string }[],
  payload: { titulo: string; mensagem: string; url?: string }
) {
  const body = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}

/**
 * Envia um push para todos os dispositivos cadastrados de um profile.
 * Usa o client admin (service role) porque quem dispara o push (ex.: a diretoria
 * aprovando uma vaga) não é o mesmo usuário que vai recebê-lo — a RLS de
 * push_subscriptions só permite ao próprio dono ler suas subscriptions.
 */
export async function enviarPush(
  destinatarioId: string,
  payload: { titulo: string; mensagem: string; url?: string }
) {
  garantirConfiguracao();
  if (!configurado) return;

  const admin = createAdminClient();
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("profile_id", destinatarioId);

  if (!subscriptions || subscriptions.length === 0) return;

  await enviarParaSubscriptions(admin, subscriptions, payload);
}

/**
 * Envia um push para todos os usuários com um dos papéis informados (ex.:
 * avisar admin+diretoria quando um gestor solicita aumento de quadro).
 */
export async function enviarPushPorPapel(
  papeis: PapelUsuario[],
  payload: { titulo: string; mensagem: string; url?: string }
) {
  garantirConfiguracao();
  if (!configurado) return;

  const admin = createAdminClient();
  const { data: profiles } = await admin.from("profiles").select("id").in("papel", papeis);
  if (!profiles || profiles.length === 0) return;

  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in(
      "profile_id",
      profiles.map((p) => p.id)
    );

  if (!subscriptions || subscriptions.length === 0) return;

  await enviarParaSubscriptions(admin, subscriptions, payload);
}
