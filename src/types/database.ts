export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      app_config: {
        Row: {
          id: boolean;
          logo_atualizado_em: string | null;
          logo_atualizado_por: string | null;
          logo_path: string | null;
        };
        ComputedFields: never;
        Insert: {
          id?: boolean;
          logo_atualizado_em?: string | null;
          logo_atualizado_por?: string | null;
          logo_path?: string | null;
        };
        Update: {
          id?: boolean;
          logo_atualizado_em?: string | null;
          logo_atualizado_por?: string | null;
          logo_path?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "app_config_logo_atualizado_por_fkey";
            columns: ["logo_atualizado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cargo_setor: {
        Row: {
          cargo_id: string;
          setor_id: string;
        };
        ComputedFields: never;
        Insert: {
          cargo_id: string;
          setor_id: string;
        };
        Update: {
          cargo_id?: string;
          setor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cargo_setor_cargo_id_fkey";
            columns: ["cargo_id"];
            isOneToOne: false;
            referencedRelation: "cargos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cargo_setor_setor_id_fkey";
            columns: ["setor_id"];
            isOneToOne: false;
            referencedRelation: "setores";
            referencedColumns: ["id"];
          },
        ];
      };
      cargos: {
        Row: {
          created_at: string;
          id: string;
          nome: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          nome: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          nome?: string;
        };
        Relationships: [];
      };
      funcionarios: {
        Row: {
          assinatura_path: string | null;
          ativo: boolean;
          created_at: string;
          eh_gestor: boolean;
          email: string | null;
          id: string;
          nome: string;
          unidade_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          assinatura_path?: string | null;
          ativo?: boolean;
          created_at?: string;
          eh_gestor?: boolean;
          email?: string | null;
          id?: string;
          nome: string;
          unidade_id?: string | null;
        };
        Update: {
          assinatura_path?: string | null;
          ativo?: boolean;
          created_at?: string;
          eh_gestor?: boolean;
          email?: string | null;
          id?: string;
          nome?: string;
          unidade_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "funcionarios_unidade_id_fkey";
            columns: ["unidade_id"];
            isOneToOne: false;
            referencedRelation: "unidades";
            referencedColumns: ["id"];
          },
        ];
      };
      historico_status: {
        Row: {
          alterado_em: string;
          alterado_por: string | null;
          id: string;
          observacao: string | null;
          situacao_anterior: Database["public"]["Enums"]["situacao_vaga"] | null;
          situacao_nova: Database["public"]["Enums"]["situacao_vaga"];
          tipo_evento: string;
          vaga_id: string;
        };
        ComputedFields: never;
        Insert: {
          alterado_em?: string;
          alterado_por?: string | null;
          id?: string;
          observacao?: string | null;
          situacao_anterior?: Database["public"]["Enums"]["situacao_vaga"] | null;
          situacao_nova: Database["public"]["Enums"]["situacao_vaga"];
          tipo_evento?: string;
          vaga_id: string;
        };
        Update: {
          alterado_em?: string;
          alterado_por?: string | null;
          id?: string;
          observacao?: string | null;
          situacao_anterior?: Database["public"]["Enums"]["situacao_vaga"] | null;
          situacao_nova?: Database["public"]["Enums"]["situacao_vaga"];
          tipo_evento?: string;
          vaga_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "historico_status_alterado_por_fkey";
            columns: ["alterado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "historico_status_vaga_id_fkey";
            columns: ["vaga_id"];
            isOneToOne: false;
            referencedRelation: "vagas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "historico_status_vaga_id_fkey";
            columns: ["vaga_id"];
            isOneToOne: false;
            referencedRelation: "vagas_detalhada";
            referencedColumns: ["id"];
          },
        ];
      };
      horarios_trabalho: {
        Row: {
          created_at: string;
          id: string;
          nome: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          nome: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          nome?: string;
        };
        Relationships: [];
      };
      notificacao_tipo_config: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          atualizado_por: string | null;
          tipo: string;
        };
        ComputedFields: never;
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          atualizado_por?: string | null;
          tipo: string;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          atualizado_por?: string | null;
          tipo?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notificacao_tipo_config_atualizado_por_fkey";
            columns: ["atualizado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notificacoes: {
        Row: {
          created_at: string;
          destinatario_id: string;
          id: string;
          lida: boolean;
          lida_em: string | null;
          mensagem: string;
          tipo: string;
          titulo: string;
          vaga_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          destinatario_id: string;
          id?: string;
          lida?: boolean;
          lida_em?: string | null;
          mensagem: string;
          tipo: string;
          titulo: string;
          vaga_id?: string | null;
        };
        Update: {
          created_at?: string;
          destinatario_id?: string;
          id?: string;
          lida?: boolean;
          lida_em?: string | null;
          mensagem?: string;
          tipo?: string;
          titulo?: string;
          vaga_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notificacoes_destinatario_id_fkey";
            columns: ["destinatario_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notificacoes_vaga_id_fkey";
            columns: ["vaga_id"];
            isOneToOne: false;
            referencedRelation: "vagas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notificacoes_vaga_id_fkey";
            columns: ["vaga_id"];
            isOneToOne: false;
            referencedRelation: "vagas_detalhada";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_unidades: {
        Row: {
          profile_id: string;
          unidade_id: string;
        };
        ComputedFields: never;
        Insert: {
          profile_id: string;
          unidade_id: string;
        };
        Update: {
          profile_id?: string;
          unidade_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_unidades_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_unidades_unidade_id_fkey";
            columns: ["unidade_id"];
            isOneToOne: false;
            referencedRelation: "unidades";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          funcionario_id: string | null;
          id: string;
          nome: string;
          papel: Database["public"]["Enums"]["papel_usuario"];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          funcionario_id?: string | null;
          id: string;
          nome: string;
          papel?: Database["public"]["Enums"]["papel_usuario"];
        };
        Update: {
          created_at?: string;
          funcionario_id?: string | null;
          id?: string;
          nome?: string;
          papel?: Database["public"]["Enums"]["papel_usuario"];
        };
        Relationships: [
          {
            foreignKeyName: "profiles_funcionario_id_fkey";
            columns: ["funcionario_id"];
            isOneToOne: false;
            referencedRelation: "funcionarios";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          endpoint: string;
          id: string;
          p256dh: string;
          profile_id: string;
          user_agent: string | null;
        };
        ComputedFields: never;
        Insert: {
          auth: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          p256dh: string;
          profile_id: string;
          user_agent?: string | null;
        };
        Update: {
          auth?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          p256dh?: string;
          profile_id?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      setores: {
        Row: {
          created_at: string;
          id: string;
          nome: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          nome: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          nome?: string;
        };
        Relationships: [];
      };
      unidades: {
        Row: {
          ativo: boolean;
          codigo: string | null;
          created_at: string;
          id: string;
          nome: string;
        };
        ComputedFields: never;
        Insert: {
          ativo?: boolean;
          codigo?: string | null;
          created_at?: string;
          id?: string;
          nome: string;
        };
        Update: {
          ativo?: boolean;
          codigo?: string | null;
          created_at?: string;
          id?: string;
          nome?: string;
        };
        Relationships: [];
      };
      vagas: {
        Row: {
          candidato_aprovado: string | null;
          cargo_id: string;
          created_at: string;
          data_abertura: string;
          data_admissao: string | null;
          data_cancelamento: string | null;
          data_fechamento: string | null;
          experiencia_1_status: Database["public"]["Enums"]["status_experiencia"];
          experiencia_2_status: Database["public"]["Enums"]["status_experiencia"];
          gestor_id: string | null;
          horario_trabalho_id: string | null;
          id: string;
          justificativa: string | null;
          motivo: Database["public"]["Enums"]["motivo_vaga"];
          motivo_suspensao: string | null;
          numero: number;
          numero_senior: string | null;
          observacoes: string | null;
          periodo_experiencia_1: string | null;
          periodo_experiencia_2: string | null;
          previsao_fechamento: string | null;
          recrutador_id: string | null;
          setor_id: string;
          situacao: Database["public"]["Enums"]["situacao_vaga"];
          sla_dias: number;
          suspensa: boolean;
          unidade_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          candidato_aprovado?: string | null;
          cargo_id: string;
          created_at?: string;
          data_abertura?: string;
          data_admissao?: string | null;
          data_cancelamento?: string | null;
          data_fechamento?: string | null;
          experiencia_1_status?: Database["public"]["Enums"]["status_experiencia"];
          experiencia_2_status?: Database["public"]["Enums"]["status_experiencia"];
          gestor_id?: string | null;
          horario_trabalho_id?: string | null;
          id?: string;
          justificativa?: string | null;
          motivo: Database["public"]["Enums"]["motivo_vaga"];
          motivo_suspensao?: string | null;
          numero?: number;
          numero_senior?: string | null;
          observacoes?: string | null;
          periodo_experiencia_1?: never;
          periodo_experiencia_2?: never;
          previsao_fechamento?: never;
          recrutador_id?: string | null;
          setor_id: string;
          situacao?: Database["public"]["Enums"]["situacao_vaga"];
          sla_dias?: number;
          suspensa?: boolean;
          unidade_id: string;
          updated_at?: string;
        };
        Update: {
          candidato_aprovado?: string | null;
          cargo_id?: string;
          created_at?: string;
          data_abertura?: string;
          data_admissao?: string | null;
          data_cancelamento?: string | null;
          data_fechamento?: string | null;
          experiencia_1_status?: Database["public"]["Enums"]["status_experiencia"];
          experiencia_2_status?: Database["public"]["Enums"]["status_experiencia"];
          gestor_id?: string | null;
          horario_trabalho_id?: string | null;
          id?: string;
          justificativa?: string | null;
          motivo?: Database["public"]["Enums"]["motivo_vaga"];
          motivo_suspensao?: string | null;
          numero?: number;
          numero_senior?: string | null;
          observacoes?: string | null;
          periodo_experiencia_1?: never;
          periodo_experiencia_2?: never;
          previsao_fechamento?: never;
          recrutador_id?: string | null;
          setor_id?: string;
          situacao?: Database["public"]["Enums"]["situacao_vaga"];
          sla_dias?: number;
          suspensa?: boolean;
          unidade_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vagas_cargo_id_fkey";
            columns: ["cargo_id"];
            isOneToOne: false;
            referencedRelation: "cargos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vagas_gestor_id_fkey";
            columns: ["gestor_id"];
            isOneToOne: false;
            referencedRelation: "funcionarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vagas_horario_trabalho_id_fkey";
            columns: ["horario_trabalho_id"];
            isOneToOne: false;
            referencedRelation: "horarios_trabalho";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vagas_recrutador_id_fkey";
            columns: ["recrutador_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vagas_setor_id_fkey";
            columns: ["setor_id"];
            isOneToOne: false;
            referencedRelation: "setores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vagas_unidade_id_fkey";
            columns: ["unidade_id"];
            isOneToOne: false;
            referencedRelation: "unidades";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      vagas_detalhada: {
        Row: {
          candidato_aprovado: string | null;
          cargo_id: string;
          cargo_nome: string;
          created_at: string;
          data_abertura: string;
          data_admissao: string | null;
          data_cancelamento: string | null;
          data_fechamento: string | null;
          dias_em_aberto: number | null;
          experiencia_1_status: Database["public"]["Enums"]["status_experiencia"];
          experiencia_2_status: Database["public"]["Enums"]["status_experiencia"];
          gestor_id: string | null;
          gestor_nome: string | null;
          horario_trabalho_id: string | null;
          horario_trabalho_nome: string | null;
          id: string;
          justificativa: string | null;
          motivo: Database["public"]["Enums"]["motivo_vaga"];
          motivo_suspensao: string | null;
          numero: number;
          numero_senior: string | null;
          observacoes: string | null;
          periodo_experiencia_1: string | null;
          periodo_experiencia_2: string | null;
          previsao_fechamento: string | null;
          recrutador_id: string | null;
          recrutador_nome: string | null;
          setor_id: string;
          setor_nome: string;
          situacao: Database["public"]["Enums"]["situacao_vaga"];
          sla_dias: number;
          status_sla: string | null;
          suspensa: boolean;
          unidade_id: string;
          unidade_nome: string;
          updated_at: string;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "vagas_cargo_id_fkey";
            columns: ["cargo_id"];
            isOneToOne: false;
            referencedRelation: "cargos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vagas_gestor_id_fkey";
            columns: ["gestor_id"];
            isOneToOne: false;
            referencedRelation: "funcionarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vagas_horario_trabalho_id_fkey";
            columns: ["horario_trabalho_id"];
            isOneToOne: false;
            referencedRelation: "horarios_trabalho";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vagas_recrutador_id_fkey";
            columns: ["recrutador_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vagas_setor_id_fkey";
            columns: ["setor_id"];
            isOneToOne: false;
            referencedRelation: "setores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vagas_unidade_id_fkey";
            columns: ["unidade_id"];
            isOneToOne: false;
            referencedRelation: "unidades";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      fn_criar_notificacao: {
        Args: {
          p_destinatario_id: string;
          p_mensagem: string;
          p_tipo: string;
          p_titulo: string;
          p_vaga_id?: string;
        };
        Returns: string;
      };
      fn_definir_minha_assinatura: { Args: { p_path: string }; Returns: undefined };
      fn_has_unidade_access: { Args: { p_unidade_id: string }; Returns: boolean };
      fn_is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      fn_is_my_unidade: { Args: { p_unidade_id: string }; Returns: boolean };
      fn_is_recrutador: { Args: Record<PropertyKey, never>; Returns: boolean };
      fn_is_super_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      fn_my_funcionario_id: { Args: Record<PropertyKey, never>; Returns: string };
      fn_notificar_por_papel: {
        Args: {
          p_mensagem: string;
          p_papel: Database["public"]["Enums"]["papel_usuario"];
          p_tipo: string;
          p_titulo: string;
          p_vaga_id?: string;
        };
        Returns: undefined;
      };
      fn_remover_minha_assinatura: { Args: Record<PropertyKey, never>; Returns: string };
      fn_verificar_sla_atrasado: { Args: Record<PropertyKey, never>; Returns: undefined };
      fn_verificar_sla_vencendo: { Args: Record<PropertyKey, never>; Returns: undefined };
      fn_verificar_vencimento_experiencia: { Args: Record<PropertyKey, never>; Returns: undefined };
    };
    Enums: {
      motivo_vaga: "substituicao" | "aumento_de_quadro";
      papel_usuario: "diretoria" | "recrutador" | "gestor" | "admin" | "gerente";
      situacao_vaga: "em_aberto" | "fechado" | "cancelado" | "pendente_aprovacao" | "rejeitado";
      status_experiencia: "pendente" | "aprovado" | "reprovado";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      motivo_vaga: ["substituicao", "aumento_de_quadro"],
      papel_usuario: ["diretoria", "recrutador", "gestor", "admin", "gerente"],
      situacao_vaga: ["em_aberto", "fechado", "cancelado", "pendente_aprovacao", "rejeitado"],
      status_experiencia: ["pendente", "aprovado", "reprovado"],
    },
  },
} as const;

export type PapelUsuario = (typeof Constants.public.Enums.papel_usuario)[number];
export type MotivoVaga = (typeof Constants.public.Enums.motivo_vaga)[number];
export type SituacaoVaga = (typeof Constants.public.Enums.situacao_vaga)[number];
export type StatusExperiencia = (typeof Constants.public.Enums.status_experiencia)[number];
export type StatusSla = "no_prazo" | "em_atraso" | "suspenso";
