"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { solicitarVagaSchema, type SolicitarVagaValues } from "@/lib/validators/vaga";
import { atualizarMinhaSolicitacao, solicitarVaga } from "@/lib/actions/vagas";
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

export function SolicitarVagaForm({
  cargos,
  setores,
  cargoSetorMap,
  vagaId,
  defaultValues,
  onSuccess,
}: {
  cargos: Opcao[];
  setores: Opcao[];
  cargoSetorMap: Record<string, string[]>;
  vagaId?: string;
  defaultValues?: SolicitarVagaValues;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SolicitarVagaValues>({
    resolver: zodResolver(solicitarVagaSchema),
    defaultValues: defaultValues ?? { cargo_id: "", setor_id: "", motivo: "substituicao" },
  });

  const cargoId = watch("cargo_id");
  const motivo = watch("motivo");

  const setoresSugeridos = useMemo(() => {
    const ids = cargoSetorMap[cargoId] ?? [];
    return setores.filter((s) => ids.includes(s.id));
  }, [cargoId, cargoSetorMap, setores]);

  function handleCargoChange(id: string | null) {
    if (!id) return;
    setValue("cargo_id", id, { shouldValidate: true });
    const sugeridos = cargoSetorMap[id] ?? [];
    if (sugeridos.length === 1) {
      setValue("setor_id", sugeridos[0], { shouldValidate: true });
    }
  }

  async function onSubmit(values: SolicitarVagaValues) {
    setSubmitting(true);
    const result = vagaId
      ? await atualizarMinhaSolicitacao(vagaId, values)
      : await solicitarVaga(values);
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(vagaId ? "Solicitação atualizada" : "Solicitação enviada ao RH");
    if (!vagaId) reset({ cargo_id: "", setor_id: "", motivo: "substituicao" });
    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label>Cargo</Label>
          <Controller
            control={control}
            name="cargo_id"
            render={({ field }) => (
              <Select value={field.value || null} onValueChange={handleCargoChange}>
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
          {errors.cargo_id && <p className="text-sm text-destructive">{errors.cargo_id.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Setor</Label>
          <Controller
            control={control}
            name="setor_id"
            render={({ field }) => (
              <Select value={field.value || null} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o setor">
                    {(value: string | null) =>
                      setores.find((s) => s.id === value)?.nome ?? "Selecione o setor"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(setoresSugeridos.length > 0 ? setoresSugeridos : setores).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.setor_id && <p className="text-sm text-destructive">{errors.setor_id.message}</p>}
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
                    {(value: string | null) => (value && MOTIVO_VAGA_LABEL[value]) ?? "Selecione o motivo"}
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
          {motivo === "aumento_de_quadro" && (
            <p className="text-xs text-amber-600 dark:text-amber-500">
              Esta solicitação será enviada para aprovação da diretoria antes de entrar em
              recrutamento.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="horario_trabalho">Horário de trabalho</Label>
          <Input id="horario_trabalho" {...register("horario_trabalho")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="justificativa">Justificativa</Label>
        <Textarea
          id="justificativa"
          rows={3}
          placeholder="Ex.: substituição de fulano, que foi desligado"
          {...register("justificativa")}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : vagaId ? "Salvar alterações" : "Solicitar vaga"}
        </Button>
      </div>
    </form>
  );
}
