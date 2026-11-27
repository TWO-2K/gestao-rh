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
      className="fixed right-4 bottom-4 z-50 hidden w-64 border-primary/30 shadow-xl ring-primary/20 animate-in fade-in slide-in-from-bottom-2 md:block"
    >
      <CardHeader className="pb-0">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Image
              src="/brand/mais-barato-logo.png"
              alt=""
              width={20}
              height={20}
              unoptimized
              className="size-5 object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-sm">Instale o RH +B</CardTitle>
            <CardDescription className="text-xs leading-snug">
              Acesso rápido pela tela inicial
            </CardDescription>
          </div>
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
      <CardFooter className="justify-end gap-2 bg-transparent border-t-0 pt-1">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={dispensar} disabled={instalando}>
          Agora não
        </Button>
        <Button size="sm" className="h-7 px-2.5 text-xs" onClick={handleInstalar} disabled={instalando}>
          <Download className="size-3.5" />
          Instalar
        </Button>
      </CardFooter>
    </Card>
  );
}
