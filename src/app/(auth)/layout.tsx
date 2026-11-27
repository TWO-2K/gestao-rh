import Image from "next/image";
import { MARCA } from "@/lib/constants";
import { getLogoUrl } from "@/lib/data/config";
import { ModeToggle } from "@/components/mode-toggle";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const logoUrl = await getLogoUrl();

  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4 py-8">
      <ModeToggle className="absolute top-4 right-4" />
      <div className="mb-4 flex flex-col items-center gap-2 sm:mb-8">
        <Image
          src={logoUrl}
          alt={MARCA.nome}
          width={160}
          height={80}
          priority
          unoptimized
          className="h-12 w-auto sm:h-16"
        />
        <p className="text-sm text-muted-foreground">
          Recrutamento &amp; Seleção
        </p>
      </div>
      {children}
    </div>
  );
}
