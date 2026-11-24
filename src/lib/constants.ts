export const MARCA = {
  nome: "+B Mais Barato",
  grupo: "Grupo +B",
  logoSupermercado: "/brand/mais-barato-logo.png",
  logoFarma: "/brand/mais-farma-logo.png",
};

export const MOTIVO_VAGA_LABEL: Record<string, string> = {
  substituicao: "Substituição",
  aumento_de_quadro: "Aumento de Quadro",
};

export const SITUACAO_VAGA_LABEL: Record<string, string> = {
  pendente_aprovacao: "Pendente de aprovação",
  em_aberto: "Em aberto",
  fechado: "Fechado",
  cancelado: "Cancelado",
};

export const STATUS_SLA_LABEL: Record<string, string> = {
  no_prazo: "No Prazo",
  em_atraso: "Em Atraso",
  suspenso: "Suspenso",
};

export const STATUS_SLA_BADGE_VARIANT: Record<string, string> = {
  no_prazo: "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500",
  em_atraso: "bg-red-600 text-white border-red-600 dark:bg-red-500 dark:border-red-500",
  suspenso: "bg-amber-500 text-white border-amber-500 dark:bg-amber-500 dark:border-amber-500",
};

export const SITUACAO_BADGE_VARIANT: Record<string, string> = {
  pendente_aprovacao: "bg-amber-500 text-white border-amber-500 dark:bg-amber-500 dark:border-amber-500",
  em_aberto: "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500",
  fechado: "bg-slate-500 text-white border-slate-500 dark:bg-slate-600 dark:border-slate-600",
  cancelado: "bg-red-600 text-white border-red-600 dark:bg-red-500 dark:border-red-500",
};

export const PAPEL_LABEL: Record<string, string> = {
  admin: "Administrador",
  diretoria: "Diretoria",
  recrutador: "Recrutador(a)",
  gestor: "Gestor(a) solicitante",
};

export const PAPEL_BADGE_VARIANT: Record<string, string> = {
  admin: "bg-red-600 text-white border-red-600 dark:bg-red-500 dark:border-red-500",
  diretoria: "bg-primary text-primary-foreground border-primary",
  recrutador: "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500",
  gestor: "bg-amber-600 text-white border-amber-600 dark:bg-amber-500 dark:border-amber-500",
};
