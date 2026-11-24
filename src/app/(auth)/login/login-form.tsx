"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const EMAIL_LEMBRADO_KEY = "gestao-rh:email-lembrado";

const schema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const [emailLembrado] = useState(
    () => (typeof window !== "undefined" && localStorage.getItem(EMAIL_LEMBRADO_KEY)) || ""
  );
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrarAcesso, setLembrarAcesso] = useState(() => emailLembrado !== "");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: emailLembrado, password: "" },
  });

  async function onSubmit(values: FormValues) {
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setErro("E-mail ou senha incorretos.");
      return;
    }
    if (lembrarAcesso) {
      localStorage.setItem(EMAIL_LEMBRADO_KEY, values.email);
    } else {
      localStorage.removeItem(EMAIL_LEMBRADO_KEY);
    }
    router.replace("/vagas");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>
          Acesse com o e-mail cadastrado pelo RH.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Senha</Label>
            <InputGroup>
              <InputGroupInput
                id="password"
                type={mostrarSenha ? "text" : "password"}
                autoComplete="current-password"
                {...register("password")}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  aria-label={mostrarSenha ? "Ocultar senha" : "Ver senha"}
                  onClick={() => setMostrarSenha((v) => !v)}
                >
                  {mostrarSenha ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              id="lembrar-acesso"
              type="checkbox"
              className="size-4 rounded border-input accent-primary"
              checked={lembrarAcesso}
              onChange={(e) => setLembrarAcesso(e.target.checked)}
            />
            <Label htmlFor="lembrar-acesso" className="font-normal text-muted-foreground">
              Lembrar meu acesso
            </Label>
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <Button type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
