"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { salvarPushSubscription, removerPushSubscription } from "@/lib/actions/notificacoes";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

type Suporte = "verificando" | "indisponivel" | "disponivel";

export function PushToggle() {
  const [suporte, setSuporte] = useState<Suporte>("verificando");
  const [ativo, setAtivo] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    async function checar() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setSuporte("indisponivel");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription = await registration.pushManager.getSubscription();
        setAtivo(!!subscription);
        setSuporte("disponivel");
      } catch {
        setSuporte("indisponivel");
      }
    }
    checar();
  }, []);

  async function ativar() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return;

    setCarregando(true);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        toast.error("Permissão de notificação negada no navegador.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = subscription.toJSON();
      const { error } = await salvarPushSubscription({
        endpoint: subscription.endpoint,
        keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      });
      if (error) {
        toast.error(error);
        return;
      }
      setAtivo(true);
      toast.success("Notificações push ativadas neste navegador.");
    } catch {
      toast.error("Não foi possível ativar as notificações push.");
    } finally {
      setCarregando(false);
    }
  }

  async function desativar() {
    setCarregando(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await removerPushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setAtivo(false);
      toast.success("Notificações push desativadas neste navegador.");
    } catch {
      toast.error("Não foi possível desativar as notificações push.");
    } finally {
      setCarregando(false);
    }
  }

  if (suporte !== "disponivel") return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto gap-1.5 px-1.5 text-xs"
      disabled={carregando}
      onClick={ativo ? desativar : ativar}
      title={
        ativo
          ? "Desativar notificações push neste navegador"
          : "Ativar notificações push neste navegador"
      }
    >
      {ativo ? <BellRing className="size-3.5" /> : <BellOff className="size-3.5" />}
      {ativo ? "Push ativo" : "Ativar push"}
    </Button>
  );
}
