-- Vencimento de período de experiência (45/90 dias após admissão): avisa o
-- recrutador responsável (ou admin/diretoria, se a vaga não tem um) e o gestor
-- que solicitou a vaga, a tempo de decidir pela efetivação ou desligamento.
--
-- Isso não é disparado por uma action/trigger de usuário (não existe um
-- evento "vencer" no app) — é um job diário via pg_cron que varre
-- periodo_experiencia_1/2 (colunas geradas a partir de data_admissao, ver
-- 20261123164451_init_schema.sql) e cria a notificação na primeira vez que o
-- prazo entra na janela de até 7 dias (ou já vencido). Dedup é feito
-- verificando se já existe notificacao com aquele tipo para a vaga — como o
-- tipo é específico por período (experiencia_1_vencendo/experiencia_2_vencendo)
-- e a query só olha período ainda "pendente", o alerta para de ser gerado
-- sozinho assim que o RH aprova/reprova aquele período.
--
-- Só cria notificação in-app (fn_criar_notificacao/fn_notificar_por_papel já
-- existentes). Push (enviarPush, em src/lib/push.ts) não é acionado aqui:
-- é código Node/web-push, inalcançável de dentro do Postgres sem montar um
-- endpoint HTTP + pg_net só para isso — fora de escopo para um job em lote.
create extension if not exists pg_cron;

create or replace function public.fn_verificar_vencimento_experiencia()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
  v_tipo text;
  v_periodo_label text;
  v_dias int;
  v_titulo text;
  v_mensagem text;
begin
  for v in (
    select vd.id, vd.numero, vd.cargo_nome, vd.gestor_id, vd.recrutador_id,
      1 as periodo, vd.periodo_experiencia_1 as periodo_data
    from public.vagas_detalhada vd
    where vd.situacao = 'fechado'
      and vd.experiencia_1_status = 'pendente'
      and vd.periodo_experiencia_1 is not null
      and vd.periodo_experiencia_1 - current_date <= 7
      and not exists (
        select 1 from public.notificacoes n
        where n.vaga_id = vd.id and n.tipo = 'experiencia_1_vencendo'
      )

    union all

    select vd.id, vd.numero, vd.cargo_nome, vd.gestor_id, vd.recrutador_id,
      2 as periodo, vd.periodo_experiencia_2 as periodo_data
    from public.vagas_detalhada vd
    where vd.situacao = 'fechado'
      and vd.experiencia_2_status = 'pendente'
      and vd.periodo_experiencia_2 is not null
      and vd.periodo_experiencia_2 - current_date <= 7
      and not exists (
        select 1 from public.notificacoes n
        where n.vaga_id = vd.id and n.tipo = 'experiencia_2_vencendo'
      )
  )
  loop
    v_dias := v.periodo_data - current_date;
    v_tipo := 'experiencia_' || v.periodo || '_vencendo';
    v_periodo_label := case v.periodo when 1 then '1º período' else '2º período' end;
    v_titulo := 'Período de experiência vencendo';
    v_mensagem := format(
      'Vaga de %s (nº %s): o %s de experiência %s. Decida pela efetivação ou desligamento.',
      coalesce(v.cargo_nome, 'vaga'),
      v.numero,
      v_periodo_label,
      case
        when v_dias < 0 then 'venceu há ' || abs(v_dias) || ' dia(s)'
        when v_dias = 0 then 'vence hoje'
        else 'vence em ' || v_dias || ' dia(s)'
      end
    );

    if v.recrutador_id is not null then
      perform public.fn_criar_notificacao(v.recrutador_id, v_tipo, v_titulo, v_mensagem, v.id);
    else
      perform public.fn_notificar_por_papel('admin', v_tipo, v_titulo, v_mensagem, v.id);
      perform public.fn_notificar_por_papel('diretoria', v_tipo, v_titulo, v_mensagem, v.id);
    end if;

    if v.gestor_id is not null then
      insert into public.notificacoes (destinatario_id, tipo, titulo, mensagem, vaga_id)
      select p.id, v_tipo, v_titulo, v_mensagem, v.id
      from public.profiles p
      where p.funcionario_id = v.gestor_id;
    end if;
  end loop;
end;
$$;

-- Migration pode rodar mais de uma vez em dev (supabase db reset) — remove o
-- job antigo antes de recriar, para não duplicar o agendamento. cron.job não
-- é acessível por DML direto fora de superuser; cron.unschedule() é a forma
-- suportada, e falha (ignorada aqui) se o job ainda não existir.
do $$
begin
  perform cron.unschedule('verificar-vencimento-experiencia');
exception
  when others then null;
end;
$$;

select cron.schedule(
  'verificar-vencimento-experiencia',
  '0 7 * * *',
  $$select public.fn_verificar_vencimento_experiencia();$$
);
