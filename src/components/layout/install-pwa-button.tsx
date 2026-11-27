"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";

export function InstallPwaButton() {
  const { podeInstalar, instalar } = useInstallPrompt();
  const [instalando, setInstalando] = useState(false);

  if (!podeInstalar) return null;

  async function handleInstalar() {
    setInstalando(true);
    const outcome = await instalar();
    setInstalando(false);
    if (outcome === "dismissed") {
      toast.info("Instalação cancelada.");
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      disabled={instalando}
      onClick={handleInstalar}
      title="Instalar o RH +B como aplicativo"
    >
      <Download className="size-3.5" />
    </Button>
  );
}
