"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { alternarAtivoFuncionario } from "@/lib/actions/funcionarios";

export function FuncionarioAtivoToggle({ id, ativo }: { id: string; ativo: boolean }) {
  const router = useRouter();

  async function handleClick() {
    const result = await alternarAtivoFuncionario(id, !ativo);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick}>
      {ativo ? "Desativar" : "Reativar"}
    </Button>
  );
}
