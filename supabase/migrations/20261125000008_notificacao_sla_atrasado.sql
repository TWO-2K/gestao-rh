-- Vaga entrando em atraso de SLA (status_sla vira 'em_atraso' em
-- vagas_detalhada, ver 20261125000002_vagas_detalhada_experiencia_status.sql):
-- avisa o(a) recrutador(a) responsável e também a diretoria — diferente do
-- alerta de 20261125000007_notificacao_sla_vencendo.sql, que avisa só o
-- recrutador antes do prazo vencer, aqui o atraso já aconteceu e a
-- diretoria também precisa saber. Se a vaga não tem recrutador, cai para
-- admin+diretoria (mesmo fallback do alerta de vencimento).
--
-- Mesmo padrão de job diário via pg_cron + dedup por tipo+vaga.
create or replace function public.fn_verificar_sla_atrasado()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
  v_tipo text := 'vaga_sla_atrasada';
  v_titulo text;
  v_mensagem text;
begin
  for v in (
    select vd.id, vd.numero, vd.cargo_nome, vd.unidade_nome, vd.recrutador_id,
      (vd.dias_em_aberto - vd.sla_dias) as dias_atraso
    from public.vagas_detalhada vd
    where vd.situacao = 'em_aberto'
      and not vd.suspensa
      and vd.status_sla = 'em_atraso'
      and not exists (
        select 1 from public.notificacoes n
        where n.vaga_id = vd.id and n.tipo = v_tipo
      )
  )
  loop
    v_titulo := 'Vaga atrasou o SLA';
    v_mensagem := format(
      'Vaga de %s (nº %s, %s) está em atraso: %s dia(s) além do prazo de SLA.',
      coalesce(v.cargo_nome, 'vaga'),
      v.numero,
      coalesce(v.unidade_nome, 'unidade'),
      v.dias_atraso
    );

    if v.recrutador_id is not null then
      perform public.fn_criar_notificacao(v.recrutador_id, v_tipo, v_titulo, v_mensagem, v.id);
    else
      perform public.fn_notificar_por_papel('admin', v_tipo, v_titulo, v_mensagem, v.id);
    end if;

    perform public.fn_notificar_por_papel('diretoria', v_tipo, v_titulo, v_mensagem, v.id);
  end loop;
end;
$$;

do $$
begin
  perform cron.unschedule('verificar-sla-atrasado');
exception
  when others then null;
end;
$$;

select cron.schedule(
  'verificar-sla-atrasado',
  '5 7 * * *',
  $$select public.fn_verificar_sla_atrasado();$$
);

-- Push: mesmo webhook pg_net, agora também para esse tipo.
create or replace function public.fn_notificar_push_notificacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tipo in ('experiencia_1_vencendo', 'experiencia_2_vencendo', 'vaga_sla_vencendo', 'vaga_sla_atrasada') then
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
