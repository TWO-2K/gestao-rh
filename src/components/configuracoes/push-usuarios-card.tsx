import { BellRing } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type UsuarioPush = {
  nome: string;
  email: string;
  dispositivos: number;
  ultimaAtivacao: string;
};

export function PushUsuariosCard({ usuarios }: { usuarios: UsuarioPush[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações push ativadas</CardTitle>
        <CardDescription>
          Usuários que autorizaram receber notificações push do sistema no navegador.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {usuarios.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum usuário ativou notificações push ainda.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {usuarios.map((usuario) => (
              <li key={usuario.email} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <BellRing className="size-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">{usuario.nome}</span>
                    <span className="text-xs text-muted-foreground">{usuario.email}</span>
                  </div>
                </div>
                <Badge variant="secondary">
                  {usuario.dispositivos} dispositivo{usuario.dispositivos > 1 ? "s" : ""}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
