"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { vagaFormSchema, type VagaFormValues } from "@/lib/validators/vaga";
import { criarVaga, atualizarVaga } from "@/lib/actions/vagas";
import { MOTIVO_VAGA_LABEL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Opcao = { id: string; nome: string };

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo?: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {titulo && (
        <div>
          <h3 className="text-sm font-semibold">{titulo}</h3>
          {descricao && <p className="text-xs text-muted-foreground">{descricao}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function lerRascunho(chave: string): Partial<VagaFormValues> | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.localStorage.getItem(chave);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

export function VagaForm({
  unidades,
  cargos,
  setores,
  funcionarios,
  cargoSetorMap,
  vagaId,
  defaultValues,
  draftKey,
  onSuccess,
  onDirtyChange,
}: {
  unidades: Opcao[];
  cargos: Opcao[];
  setores: Opcao[];
  funcionarios: Opcao[];
  cargoSetorMap: Record<string, string[]>;
  vagaId?: string;
  defaultValues?: Partial<VagaFormValues>;
  draftKey?: string;
  onSuccess?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const avisouRascunho = useRef(false);

  const valoresBase = useMemo<VagaFormValues>(
    () => ({
      unidade_id: "",
      cargo_id: "",
      setor_id: "",
      motivo: "substituicao",
      sla_dias: 20,
      data_abertura: new Date().toISOString().slice(0, 10),
      ...defaultValues,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<VagaFormValues>({
    resolver: zodResolver(vagaFormSchema),
    defaultValues: valoresBase,
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Restaura rascunho salvo (ex.: a tela recarregou sozinha) ao abrir o formulário.
  useEffect(() => {
    if (!draftKey || avisouRascunho.current) return;
    avisouRascunho.current = true;
    const rascunho = lerRascunho(draftKey);
    if (rascunho) {
      reset({ ...valoresBase, ...rascunho });
      toast.info("Rascunho não salvo recuperado", {
        description: "Continuamos de onde você parou.",
        action: {
          label: "Descartar",
          onClick: () => {
            window.localStorage.removeItem(draftKey);
            reset(valoresBase);
          },
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Salva o progresso automaticamente para não perder dados preenchidos.
  useEffect(() => {
    if (!draftKey) return;
    let timeout: ReturnType<typeof setTimeout>;
    const subscription = watch((values) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        try {
          window.localStorage.setItem(draftKey, JSON.stringify(values));
        } catch {
          // ignora falha de armazenamento (ex.: modo privado)
        }
      }, 400);
    });
    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [draftKey, watch]);

  const cargoId = watch("cargo_id");

  const setoresSugeridos = useMemo(() => {
    const ids = cargoSetorMap[cargoId] ?? [];
    return setores.filter((s) => ids.includes(s.id));
  }, [cargoId, cargoSetorMap, setores]);

  function handleCargoChange(id: string | null) {
    if (!id) return;
    setValue("cargo_id", id, { shouldValidate: true, shouldDirty: true });
    const sugeridos = cargoSetorMap[id] ?? [];
    if (sugeridos.length === 1) {
      setValue("setor_id", sugeridos[0], { shouldValidate: true, shouldDirty: true });
    }
  }

  async function onSubmit(values: VagaFormValues) {
    setSubmitting(true);
    const result = vagaId
      ? await atualizarVaga(vagaId, values)
      : await criarVaga(values);
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (draftKey) {
      window.localStorage.removeItem(draftKey);
    }
    toast.success(vagaId ? "Vaga atualizada" : "Vaga criada com sucesso");
    onSuccess?.();
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 text-sm [&_input]:text-sm [&_label]:text-xs [&_button[role=combobox]]:text-sm"
    >
      <Secao>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Unidade</Label>
            <Controller
              control={control}
              name="unidade_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a unidade">
                      {(value: string | null) =>
                        unidades.find((u) => u.id === value)?.nome ?? "Selecione a unidade"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.unidade_id && (
              <p className="text-sm text-destructive">{errors.unidade_id.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Cargo</Label>
            <Controller
              control={control}
              name="cargo_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={handleCargoChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o cargo">
                      {(value: string | null) =>
                        cargos.find((c) => c.id === value)?.nome ?? "Selecione o cargo"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {cargos.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.cargo_id && (
              <p className="text-sm text-destructive">{errors.cargo_id.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Setor</Label>
            <Controller
              control={control}
              name="setor_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o setor">
                      {(value: string | null) =>
                        setores.find((s) => s.id === value)?.nome ?? "Selecione o setor"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(setoresSugeridos.length > 0 ? setoresSugeridos : setores).map(
                      (s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nome}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.setor_id && (
              <p className="text-sm text-destructive">{errors.setor_id.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Motivo</Label>
            <Controller
              control={control}
              name="motivo"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o motivo">
                      {(value: string | null) =>
                        (value && MOTIVO_VAGA_LABEL[value]) ?? "Selecione o motivo"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MOTIVO_VAGA_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </Secao>


      <Secao>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="horario_trabalho">Horário de trabalho</Label>
            <Input id="horario_trabalho" {...register("horario_trabalho")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Gestor solicitante</Label>
            <Controller
              control={control}
              name="gestor_id"
              render={({ field }) => (
                <Select value={field.value || null} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o gestor">
                      {(value: string | null) =>
                        funcionarios.find((f) => f.id === value)?.nome ?? "Selecione o gestor"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarios.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="data_abertura">Data de abertura</Label>
            <Input id="data_abertura" type="date" {...register("data_abertura")} />
            {errors.data_abertura && (
              <p className="text-sm text-destructive">
                {errors.data_abertura.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="sla_dias">SLA (dias)</Label>
            <Input
              id="sla_dias"
              type="number"
              {...register("sla_dias", { valueAsNumber: true })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="numero_senior">Nº no sistema Senior (opcional)</Label>
            <Input id="numero_senior" {...register("numero_senior")} />
          </div>
        </div>
      </Secao>


      <Secao titulo="Justificativa">
        <Textarea
          id="justificativa"
          rows={3}
          placeholder="Ex.: substituição de fulano, que foi desligado"
          {...register("justificativa")}
        />
      </Secao>


      <Secao>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="candidato_aprovado">Candidato(a) aprovado(a)</Label>
            <Input id="candidato_aprovado" {...register("candidato_aprovado")} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="data_fechamento">Data de fechamento</Label>
            <Input id="data_fechamento" type="date" {...register("data_fechamento")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="data_admissao">Data de admissão</Label>
            <Input id="data_admissao" type="date" {...register("data_admissao")} />
            {errors.data_admissao && (
              <p className="text-sm text-destructive">
                {errors.data_admissao.message}
              </p>
            )}
          </div>
        </div>
      </Secao>


      <Secao titulo="Observações">
        <Textarea id="observacoes" rows={3} {...register("observacoes")} />
      </Secao>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : vagaId ? "Salvar alterações" : "Criar vaga"}
        </Button>
      </div>
    </form>
  );
}
