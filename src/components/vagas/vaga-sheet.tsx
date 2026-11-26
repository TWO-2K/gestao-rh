"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Briefcase,
  Building2,
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  FileText,
  Gauge,
  Hash,
  Pencil,
  Tags,
  User,
  UserCheck,
  XCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { AlertaExperiencia, AvisoAdmissaoFaltante } from "./alerta-experiencia";
import { atualizarStatusExperiencia, getHistoricoVaga } from "@/lib/actions/vagas";
import type { VagaFormValues } from "@/lib/validators/vaga";
import type { Database } from "@/types/database";

type VagaDetalhada = Database["public"]["Views"]["vagas_detalhada"]["Row"];
type Opcao = { id: string; nome: string };
type FuncionarioOpcao = {
  id: string;
  nome: string;
  unidade_id: string | null;
  eh_gestor: boolean;
};
type Mode = "view" | "edit" | "create";
type HistoricoItem = {
  id: string;
  situacao_anterior: string | null;
  situacao_nova: string;
  tipo_evento: "situacao" | "suspensao" | "edicao";
  alterado_em: string;
  observacao: string | null;
  profiles: { nome: string } | null;
};

function formatarData(data: string | null) {
  if (!data) return "—";
  return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatarDataHora(data: string) {
  return new Date(data).toLocaleString("pt-BR");
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

function AcoesExperiencia({
  vagaId,
  periodo,
  status,
}: {
  vagaId: string;
  periodo: 1 | 2;
  status: Database["public"]["Enums"]["status_experiencia"];
}) {
  const router = useRouter();

  async function marcar(novoStatus: "aprovado" | "reprovado") {
    const result = await atualizarStatusExperiencia(vagaId, periodo, novoStatus);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(
      novoStatus === "aprovado" ? "Período de experiência aprovado" : "Período de experiência reprovado"
    );
    router.refresh();
  }

  if (status !== "pendente") return null;

  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon"
        variant="ghost"
        className="size-6 text-emerald-600 hover:bg-emerald-600/10 hover:text-emerald-600 dark:text-emerald-500"
        title="Aprovar período"
        onClick={() => marcar("aprovado")}
      >
        <CheckCircle2 className="size-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-6 text-red-600 hover:bg-red-600/10 hover:text-red-600 dark:text-red-500"
        title="Reprovar período"
        onClick={() => marcar("reprovado")}
      >
        <XCircle className="size-4" />
      </Button>
    </div>
  );
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
  somenteLeitura = false,
  onEditarSolicitacao,
  currentUserId,
}: {
  unidades: Opcao[];
  cargos: Opcao[];
  setores: Opcao[];
  funcionarios: FuncionarioOpcao[];
  cargoSetorMap: Record<string, string[]>;
  vaga?: VagaDetalhada | null;
  mode?: Mode;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  somenteLeitura?: boolean;
  onEditarSolicitacao?: () => void;
  currentUserId?: string;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChangeProp ?? setInternalOpen;

  const initialMode: Mode = modeProp ?? (vaga ? "view" : "create");
  const [mode, setMode] = useState<Mode>(initialMode);
  const [formDirty, setFormDirty] = useState(false);
  const [confirmarFechar, setConfirmarFechar] = useState(false);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);

  useEffect(() => {
    if (open) setMode(initialMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vaga?.id, modeProp]);

  useEffect(() => {
    if (open && mode === "view" && vaga) {
      getHistoricoVaga(vaga.id).then((result) => {
        setHistorico((result.data as unknown as HistoricoItem[]) ?? []);
      });
    }
  }, [open, mode, vaga]);

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
            <Tabs defaultValue="detalhes" className="flex-1 gap-0">
              <div className="px-6">
                <TabsList className="w-full">
                  <TabsTrigger value="detalhes" className="flex-1">
                    Detalhes
                  </TabsTrigger>
                  <TabsTrigger value="historico" className="flex-1">
                    Histórico
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="detalhes" className="flex flex-col gap-8 px-6 pt-4 pb-2">
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
                      <div className="flex flex-wrap items-center gap-2">
                        {formatarData(vaga.data_admissao)}
                        {vaga.situacao === "fechado" && !vaga.data_admissao && (
                          <AvisoAdmissaoFaltante />
                        )}
                      </div>
                    </Campo>
                    <Campo label="1º período de experiência" icon={CalendarCheck2}>
                      <div className="flex flex-wrap items-center gap-2">
                        {formatarData(vaga.periodo_experiencia_1)}
                        {vaga.situacao !== "cancelado" && (
                          <AlertaExperiencia
                            data={vaga.periodo_experiencia_1}
                            status={vaga.experiencia_1_status}
                          />
                        )}
                        {!somenteLeitura && vaga.periodo_experiencia_1 && vaga.situacao !== "cancelado" && (
                          <AcoesExperiencia
                            vagaId={vaga.id}
                            periodo={1}
                            status={vaga.experiencia_1_status}
                          />
                        )}
                      </div>
                    </Campo>
                    <Campo label="2º período de experiência" icon={CalendarCheck2}>
                      <div className="flex flex-wrap items-center gap-2">
                        {vaga.experiencia_1_status === "reprovado" ? (
                          <span className="text-sm text-muted-foreground">
                            Não se aplica (reprovado no 1º período)
                          </span>
                        ) : (
                          <>
                            {formatarData(vaga.periodo_experiencia_2)}
                            {vaga.situacao !== "cancelado" && (
                              <AlertaExperiencia
                                data={vaga.periodo_experiencia_2}
                                status={vaga.experiencia_2_status}
                              />
                            )}
                            {!somenteLeitura &&
                              vaga.periodo_experiencia_2 &&
                              vaga.situacao !== "cancelado" && (
                                <AcoesExperiencia
                                  vagaId={vaga.id}
                                  periodo={2}
                                  status={vaga.experiencia_2_status}
                                />
                              )}
                          </>
                        )}
                      </div>
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
              </TabsContent>

              <TabsContent value="historico" className="flex flex-col gap-8 px-6 pt-4 pb-2">
                {historico.length > 0 ? (
                  <Card className="[--card-spacing:--spacing(5)]">
                    <CardContent>
                      <div className="flex flex-col">
                        {historico.map((item, index) => {
                          const isUltimo = index === historico.length - 1;
                          const dotClassName = cn(
                            "mt-1 size-2.5 shrink-0 rounded-full border-2 border-background",
                            item.tipo_evento === "suspensao"
                              ? "bg-amber-500 dark:bg-amber-500"
                              : item.tipo_evento === "edicao"
                                ? "bg-blue-500 dark:bg-blue-500"
                                : item.situacao_nova === "cancelado"
                                  ? "bg-red-600 dark:bg-red-500"
                                  : item.situacao_nova === "fechado"
                                    ? "bg-slate-500 dark:bg-slate-600"
                                    : "bg-emerald-600 dark:bg-emerald-500"
                          );
                          const titulo =
                            item.tipo_evento === "suspensao" || item.tipo_evento === "edicao"
                              ? item.observacao ?? "Vaga atualizada"
                              : item.situacao_anterior
                                ? `${SITUACAO_VAGA_LABEL[item.situacao_anterior as keyof typeof SITUACAO_VAGA_LABEL]} → ${SITUACAO_VAGA_LABEL[item.situacao_nova as keyof typeof SITUACAO_VAGA_LABEL]}`
                                : `Vaga criada (${SITUACAO_VAGA_LABEL[item.situacao_nova as keyof typeof SITUACAO_VAGA_LABEL]})`;
                          return (
                            <div key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
                              {!isUltimo && (
                                <div className="absolute top-3 left-[4.5px] h-full w-px bg-border" />
                              )}
                              <div className={dotClassName} />
                              <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-medium">{titulo}</p>
                                {item.tipo_evento === "situacao" && item.observacao && (
                                  <p className="text-xs text-muted-foreground">{item.observacao}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {formatarDataHora(item.alterado_em)}
                                  {item.profiles?.nome ? ` · ${item.profiles.nome}` : ""}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma alteração registrada ainda.
                  </p>
                )}
              </TabsContent>
            </Tabs>

            {!somenteLeitura && (
              <SheetFooter className="flex-row flex-wrap items-center justify-between gap-2 px-6 py-4">
                <VagaRowActions
                  vagaId={vaga.id}
                  situacao={vaga.situacao}
                  suspensa={vaga.suspensa}
                  variant="buttons"
                  recrutadorId={vaga.recrutador_id}
                  currentUserId={currentUserId}
                />
                <Button variant="outline" size="sm" onClick={() => setMode("edit")}>
                  <Pencil className="size-4" />
                  Editar
                </Button>
              </SheetFooter>
            )}

            {somenteLeitura && onEditarSolicitacao && vaga.situacao === "em_aberto" && (
              <SheetFooter className="flex-row justify-end gap-2 px-6 py-4">
                <Button variant="outline" size="sm" onClick={onEditarSolicitacao}>
                  <Pencil className="size-4" />
                  Editar solicitação
                </Button>
              </SheetFooter>
            )}
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
