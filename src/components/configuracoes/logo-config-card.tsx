"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUp } from "lucide-react";
import { toast } from "sonner";
import { definirLogo } from "@/lib/actions/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MAX_DIMENSAO = 512;

function redimensionarImagem(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    if (file.type === "image/svg+xml") {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const escala = Math.min(1, MAX_DIMENSAO / Math.max(img.width, img.height));
      if (escala === 1) {
        resolve(file);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name, { type: file.type }));
        },
        file.type,
        0.9,
      );
    };
    img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    img.src = url;
  });
}

export function LogoConfigCard({ logoUrl }: { logoUrl: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setEnviando(true);
    let arquivo: File;
    try {
      arquivo = await redimensionarImagem(file);
    } catch {
      arquivo = file;
    }

    const formData = new FormData();
    formData.append("logo", arquivo);

    const result = await definirLogo(formData);
    setEnviando(false);
    e.target.value = "";

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Logo atualizado");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo do sistema</CardTitle>
        <CardDescription>
          Exibido na tela de login e na barra lateral para todos os usuários.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex w-fit items-center justify-center rounded-xl border border-dashed bg-white p-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo atual" className="h-16 max-w-48 object-contain" />
          ) : (
            <span className="px-4 py-6 text-sm text-muted-foreground">Logo padrão em uso</span>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          disabled={enviando}
          onClick={() => inputRef.current?.click()}
        >
          <ImageUp className="size-4" />
          {enviando ? "Enviando..." : "Trocar logo"}
        </Button>
        <p className="text-xs text-muted-foreground">
          PNG, JPG, SVG ou WEBP, até 1 MB. Imagens maiores que 512x512px são redimensionadas
          automaticamente.
        </p>
      </CardContent>
    </Card>
  );
}
