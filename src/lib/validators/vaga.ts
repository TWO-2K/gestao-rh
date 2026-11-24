import { z } from "zod";

export const vagaFormSchema = z
  .object({
    unidade_id: z.string().uuid("Selecione a unidade"),
    cargo_id: z.string().uuid("Selecione o cargo"),
    setor_id: z.string().uuid("Selecione o setor"),
    horario_trabalho: z.string().optional().or(z.literal("")),
    gestor_id: z.string().uuid().optional().or(z.literal("")),
    motivo: z.enum(["substituicao", "aumento_de_quadro"]),
    justificativa: z.string().optional().or(z.literal("")),
    data_abertura: z.string().min(1, "Informe a data de abertura"),
    sla_dias: z.number().int().min(1).max(365),
    numero_senior: z.string().optional().or(z.literal("")),
    candidato_aprovado: z.string().optional().or(z.literal("")),
    data_fechamento: z.string().optional().or(z.literal("")),
    data_admissao: z.string().optional().or(z.literal("")),
    observacoes: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.data_admissao || !data.data_abertura) return true;
      return new Date(data.data_admissao) >= new Date(data.data_abertura);
    },
    {
      message: "A data de admissão não pode ser anterior à abertura da vaga",
      path: ["data_admissao"],
    }
  );

export type VagaFormValues = z.infer<typeof vagaFormSchema>;
