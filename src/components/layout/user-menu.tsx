"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({ nome, papel }: { nome: string; papel: string }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const iniciais = nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center rounded-full outline-none">
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {iniciais || "?"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs tracking-wide text-muted-foreground">
            CONTA
          </DropdownMenuLabel>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {iniciais || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">{nome}</span>
              <span className="text-xs text-muted-foreground">
                {papel === "admin_diretoria" ? "Diretoria" : "Recrutador(a)"}
              </span>
            </div>
          </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="font-semibold tracking-wide text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          SAIR
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
