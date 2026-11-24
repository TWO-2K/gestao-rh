"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  Building2,
  Calendar,
  CalendarCheck2,
  Clock,
  FileText,
  Gauge,
  Hash,
  Pencil,
  Tags,
  User,
  UserCheck,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MOTIVO_VAGA_LABEL,
  SITUACAO_BADGE_VARIANT,
  SITUACAO_VAGA_LABEL,
  STATUS_SLA_BADGE_VARIANT,
  STATUS_SLA_LABEL,
} from "@/lib/constants";
import { VagaForm } from "./vaga-form";
import { VagaRowActions } from "./vaga-row-actions";
import type { VagaFormValues } from "@/lib/validators/vaga";
import type { Database } from "@/types/database";

type VagaDetalhada = Database["public"]["Views"]["vagas_detalhada"]["Row"];
type Opcao = { id: string; nome: string };
type Mode = "view" | "edit" | "create";

function formatarData(data: string | null) {
  if (!data) return "—";
  return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
}

function Campo({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

function SecaoCard({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {titulo}
      </h3>
      <Card className="[--card-spacing:--spacing(5)]">
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

function vagaParaFormValues(vaga: VagaDetalhada): Partial<VagaFormValues> {
  return {
    unidade_id: vaga.unidade_id,
    cargo_id: vaga.cargo_id,
    setor_id: vaga.setor_id,
    horario_trabalho: vaga.horario_trabalho ?? "",
    gestor_id: vaga.gestor_id ?? "",
    motivo: vaga.motivo,
    justificativa: vaga.justificativa ?? "",
    data_abertura: vaga.data_abertura,
    sla_dias: vaga.sla_dias,
    numero_senior: vaga.numero_senior ?? "",
    candidato_aprovado: vaga.candidato_aprovado ?? "",
    data_fechamento: vaga.data_fechamento ?? "",
    data_admissao: vaga.data_admissao ?? "",
    observacoes: vaga.observacoes ?? "",
  };
}

export function VagaSheet({
  unidades,
  cargos,
  setores,
  funcionarios,
  cargoSetorMap,
  vaga = null,
  mode: modeProp,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  unidades: Opcao[];
  cargos: Opcao[];
  setores: Opcao[];
  funcionarios: Opcao[];
  cargoSetorMap: Record<string, string[]>;
  vaga?: VagaDetalhada | null;
  mode?: Mode;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChangeProp ?? setInternalOpen;

  const initialMode: Mode = modeProp ?? (vaga ? "view" : "create");
  const [mode, setMode] = useState<Mode>(initialMode);
  const [formDirty, setFormDirty] = useState(false);
  const [confirmarFechar, setConfirmarFechar] = useState(false);

  useEffect(() => {
    if (open) setMode(initialMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vaga?.id, modeProp]);

  useEffect(() => {
    if (!open) setFormDirty(false);
  }, [open]);

  if (mode !== "create" && !vaga) return null;

  const titulo =
    mode === "create" ? "Nova vaga" : mode === "edit" ? "Editar vaga" : `Vaga Nº ${vaga?.numero}`;

  const draftKey =
    mode === "create" ? "vaga-draft-create" : mode === "edit" && vaga ? `vaga-draft-edit-${vaga.id}` : undefined;

  function handleOpenChange(
    nextOpen: boolean,
    eventDetails?: { cancel: () => void }
  ) {
    if (!nextOpen && mode !== "view" && formDirty) {
      eventDetails?.cancel();
      setConfirmarFechar(true);
      return;
    }
    setOpen(nextOpen);
  }

  return (
    <>
      <AlertDialog open={confirmarFechar} onOpenChange={setConfirmarFechar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar sem salvar?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas nesta vaga. Seus dados ficam guardados como
              rascunho e podem ser recuperados na próxima vez que abrir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => setOpen(false)}
            >
              Fechar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Sheet open={open} onOpenChange={handleOpenChange}>
      {trigger && <SheetTrigger render={trigger} />}
      <SheetContent className="w-full overflow-y-auto data-[side=right]:sm:max-w-[34rem]">
        <SheetHeader className="gap-2 px-6 pt-5 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle className="text-lg">{titulo}</SheetTitle>
            {mode === "view" && vaga && (
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={cn("border", SITUACAO_BADGE_VARIANT[vaga.situacao])}
                >
                  {SITUACAO_VAGA_LABEL[vaga.situacao]}
                </Badge>
                {vaga.status_sla && (
                  <Badge
                    variant="outline"
                    className={cn("border", STATUS_SLA_BADGE_VARIANT[vaga.status_sla])}
                  >
                    {STATUS_SLA_LABEL[vaga.status_sla]}
                  </Badge>
                )}
                {vaga.suspensa && (
                  <Badge
                    variant="outline"
                    className="border bg-amber-500 text-white border-amber-500 dark:bg-amber-500 dark:border-amber-500"
                  >
                    Suspensa
                  </Badge>
                )}
              </div>
            )}
          </div>
          {mode === "view" && vaga && (
            <SheetDescription>
              {vaga.cargo_nome} · {vaga.unidade_nome}
            </SheetDescription>
          )}
        </SheetHeader>

        {mode === "view" && vaga ? (
          <>
            <div className="flex flex-col gap-8 px-6 pb-2">
              <SecaoCard titulo="Informações gerais">
                <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-2">
                  <Campo label="Unidade" icon={Building2}>
                    {vaga.unidade_nome}
                  </Campo>
                  <Campo label="Cargo" icon={Briefcase}>
                    {vaga.cargo_nome}
                  </Campo>
                  <Campo label="Setor" icon={Tags}>
                    {vaga.setor_nome}
                  </Campo>
                  <Campo label="Motivo" icon={FileText}>
                    {MOTIVO_VAGA_LABEL[vaga.motivo]}
                  </Campo>
                  <Campo label="Horário de trabalho" icon={Clock}>
                    {vaga.horario_trabalho ?? "—"}
                  </Campo>
                  <Campo label="Gestor solicitante" icon={User}>
                    {vaga.gestor_nome ?? "—"}
                  </Campo>
                  <Campo label="Nº Senior" icon={Hash}>
                    {vaga.numero_senior ?? "—"}
                  </Campo>
                  <Campo label="Recrutador(a)" icon={UserCheck}>
                    {vaga.recrutador_nome ?? "—"}
                  </Campo>
                  <Campo label="Abertura" icon={Calendar}>
                    {formatarData(vaga.data_abertura)}
                  </Campo>
                  <Campo label="Previsão de fechamento" icon={CalendarCheck2}>
                    {formatarData(vaga.previsao_fechamento)}
                  </Campo>
                  <Campo label="Dias em aberto" icon={Clock}>
                    {vaga.dias_em_aberto === null ? "—" : `${vaga.dias_em_aberto} dias`}
                  </Campo>
                  <Campo label="SLA (dias)" icon={Gauge}>
                    {vaga.sla_dias}
                  </Campo>
                </div>
              </SecaoCard>

              {(vaga.justificativa || vaga.observacoes) && (
                <SecaoCard titulo="Descrição e observações">
                  <div className="flex flex-col gap-4">
                    {vaga.justificativa && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Justificativa</span>
                        <p className="text-sm whitespace-pre-wrap">{vaga.justificativa}</p>
                      </div>
                    )}
                    {vaga.justificativa && vaga.observacoes && (
                      <div className="h-px bg-border" />
                    )}
                    {vaga.observacoes && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Observações</span>
                        <p className="text-sm whitespace-pre-wrap">{vaga.observacoes}</p>
                      </div>
                    )}
                  </div>
                </SecaoCard>
              )}

              {(vaga.candidato_aprovado || vaga.data_fechamento || vaga.data_admissao) && (
                <SecaoCard titulo="Fechamento">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    <Campo label="Candidato(a) aprovado(a)" icon={User}>
                      {vaga.candidato_aprovado ?? "—"}
                    </Campo>
                    <Campo label="Data de fechamento" icon={Calendar}>
                      {formatarData(vaga.data_fechamento)}
                    </Campo>
                    <Campo label="Data de admissão" icon={Calendar}>
                      {formatarData(vaga.data_admissao)}
                    </Campo>
                    <Campo label="1º período de experiência" icon={CalendarCheck2}>
                      {formatarData(vaga.periodo_experiencia_1)}
                    </Campo>
                    <Campo label="2º período de experiência" icon={CalendarCheck2}>
                      {formatarData(vaga.periodo_experiencia_2)}
                    </Campo>
                  </div>
                </SecaoCard>
              )}

              {vaga.suspensa && vaga.motivo_suspensao && (
                <SecaoCard titulo="Motivo da suspensão">
                  <p className="text-sm whitespace-pre-wrap">{vaga.motivo_suspensao}</p>
                </SecaoCard>
              )}

              {vaga.data_cancelamento && (
                <SecaoCard titulo="Cancelamento">
                  <Campo label="Data de cancelamento" icon={Calendar}>
                    {formatarData(vaga.data_cancelamento)}
                  </Campo>
                </SecaoCard>
              )}
            </div>

            <SheetFooter className="flex-row flex-wrap items-center justify-between gap-2 px-6 py-4">
              <VagaRowActions
                vagaId={vaga.id}
                situacao={vaga.situacao}
                suspensa={vaga.suspensa}
                variant="buttons"
              />
              <Button variant="outline" size="sm" onClick={() => setMode("edit")}>
                <Pencil className="size-4" />
                Editar
              </Button>
            </SheetFooter>
          </>
        ) : (
          <div className="px-4 pb-4">
            <VagaForm
              unidades={unidades}
              cargos={cargos}
              setores={setores}
              funcionarios={funcionarios}
              cargoSetorMap={cargoSetorMap}
              vagaId={mode === "edit" ? vaga?.id : undefined}
              defaultValues={vaga ? vagaParaFormValues(vaga) : undefined}
              draftKey={draftKey}
              onDirtyChange={setFormDirty}
              onSuccess={() => setOpen(false)}
            />
          </div>
        )}
      </SheetContent>
      </Sheet>
    </>
  );
}
