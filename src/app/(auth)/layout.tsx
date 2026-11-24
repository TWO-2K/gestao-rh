import Image from "next/image";
import { MARCA } from "@/lib/constants";
import { ModeToggle } from "@/components/mode-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <ModeToggle className="absolute top-4 right-4" />
      <div className="mb-8 flex flex-col items-center gap-2">
        <Image
          src={MARCA.logoSupermercado}
          alt={MARCA.nome}
          width={160}
          height={80}
          priority
          className="h-16 w-auto"
        />
        <p className="text-sm text-muted-foreground">
          Recrutamento &amp; Seleção
        </p>
      </div>
      {children}
    </div>
  );
}
