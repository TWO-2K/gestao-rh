"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

const DISMISS_KEY = "pwa-install-card-dismissed-em";
const DISMISS_DIAS = 7;

export function InstallPwaCard() {
  const { podeInstalar, instalar } = useInstallPrompt();
  const [visivel, setVisivel] = useState(false);
  const [instalando, setInstalando] = useState(false);

  useEffect(() => {
    if (!podeInstalar) {
      setVisivel(false);
      return;
    }

    const dismissedEm = localStorage.getItem(DISMISS_KEY);
    if (dismissedEm) {
      const diasPassados = (Date.now() - Number(dismissedEm)) / (1000 * 60 * 60 * 24);
      if (diasPassados < DISMISS_DIAS) return;
    }
    setVisivel(true);
  }, [podeInstalar]);

  function dispensar() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisivel(false);
  }

  async function handleInstalar() {
    setInstalando(true);
    await instalar();
    setInstalando(false);
    setVisivel(false);
  }

  if (!visivel) return null;

  return (
    <Card
      size="sm"
      className="fixed right-4 bottom-4 z-50 hidden w-72 shadow-lg animate-in fade-in md:block"
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <Image
            src="/brand/mais-barato-logo.png"
            alt=""
            width={28}
            height={28}
            unoptimized
            className="size-7 shrink-0 object-contain"
          />
          <CardTitle>Instale o RH +B</CardTitle>
        </div>
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={dispensar}
            title="Dispensar"
          >
            <X className="size-3.5" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <CardDescription>Acesse mais rápido direto da tela inicial, sem abrir o navegador.</CardDescription>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={dispensar} disabled={instalando}>
          Agora não
        </Button>
        <Button size="sm" onClick={handleInstalar} disabled={instalando}>
          <Download className="size-3.5" />
          Instalar
        </Button>
      </CardFooter>
    </Card>
  );
}
