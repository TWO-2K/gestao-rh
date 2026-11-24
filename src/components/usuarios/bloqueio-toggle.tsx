"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { alternarBloqueioUsuario } from "@/lib/actions/usuarios";

export function BloqueioToggle({ id, bloqueado }: { id: string; bloqueado: boolean }) {
  const router = useRouter();

  async function handleClick() {
    const result = await alternarBloqueioUsuario(id, !bloqueado);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick}>
      {bloqueado ? "Reativar" : "Bloquear"}
    </Button>
  );
}
