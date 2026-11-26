-- Vaga perto do vencimento do SLA (sla_dias, ver 20261123164451_init_schema.sql):
-- avisa o recrutador responsável (ou admin/diretoria, se a vaga não tem um)
-- quando faltam até 3 dias para o prazo — antes de atrasar, não só depois.
--
-- Mesmo padrão de 20261125000005_notificacao_vencimento_experiencia.sql: job
-- diário via pg_cron, varrendo vagas_detalhada (dias_em_aberto/status_sla já
-- calculados ali). Só considera vaga em_aberto, não suspensa e ainda não
-- atrasada (status_sla <> 'em_atraso') — se já atrasou, não é mais "antes de
-- atrasar". Dedup por tipo+vaga, igual experiência: o alerta para de ser
-- gerado de novo quando a vaga muda de situação (fecha/cancela), já que a
-- query só olha situacao = 'em_aberto'.
create or replace function public.fn_verificar_sla_vencendo()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
  v_tipo text := 'vaga_sla_vencendo';
  v_dias_restantes int;
  v_titulo text;
  v_mensagem text;
begin
  for v in (
    select vd.id, vd.numero, vd.cargo_nome, vd.unidade_nome, vd.recrutador_id,
      (vd.sla_dias - vd.dias_em_aberto) as dias_restantes
    from public.vagas_detalhada vd
    where vd.situacao = 'em_aberto'
      and not vd.suspensa
      and vd.status_sla = 'no_prazo'
      and (vd.sla_dias - vd.dias_em_aberto) between 0 and 3
      and not exists (
        select 1 from public.notificacoes n
        where n.vaga_id = vd.id and n.tipo = v_tipo
      )
  )
  loop
    v_dias_restantes := v.dias_restantes;
    v_titulo := 'SLA da vaga perto de vencer';
    v_mensagem := format(
      'Vaga de %s (nº %s, %s): %s. Priorize o fechamento para não atrasar.',
      coalesce(v.cargo_nome, 'vaga'),
      v.numero,
      coalesce(v.unidade_nome, 'unidade'),
      case
        when v_dias_restantes = 0 then 'o SLA vence hoje'
        when v_dias_restantes = 1 then 'falta 1 dia para o SLA vencer'
        else 'faltam ' || v_dias_restantes || ' dias para o SLA vencer'
      end
    );

    if v.recrutador_id is not null then
      perform public.fn_criar_notificacao(v.recrutador_id, v_tipo, v_titulo, v_mensagem, v.id);
    else
      perform public.fn_notificar_por_papel('admin', v_tipo, v_titulo, v_mensagem, v.id);
      perform public.fn_notificar_por_papel('diretoria', v_tipo, v_titulo, v_mensagem, v.id);
    end if;
  end loop;
end;
$$;

do $$
begin
  perform cron.unschedule('verificar-sla-vencendo');
exception
  when others then null;
end;
$$;

select cron.schedule(
  'verificar-sla-vencendo',
  '0 7 * * *',
  $$select public.fn_verificar_sla_vencendo();$$
);

-- Push: mesmo webhook pg_net de 20261125000006_notificacao_push_webhook.sql,
-- agora também para esse tipo (recrutador é o único destinatário, sem gestor
-- aqui, já que SLA é responsabilidade de quem está recrutando a vaga).
create or replace function public.fn_notificar_push_notificacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tipo in ('experiencia_1_vencendo', 'experiencia_2_vencendo', 'vaga_sla_vencendo') then
    perform net.http_post(
      url := 'http://host.docker.internal:3000/api/cron/notificar-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', 'e4a10ecbb18242da76763840604f442008c1743f07a529af'
      ),
      body := jsonb_build_object(
        'destinatario_id', new.destinatario_id,
        'titulo', new.titulo,
        'mensagem', new.mensagem,
        'url', '/notificacoes'
      )
    );
  end if;
  return new;
end;
$$;
