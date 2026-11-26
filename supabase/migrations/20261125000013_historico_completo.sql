-- Até agora o histórico só registrava mudança de `situacao` (sem contexto),
-- deixando de fora: suspensão/reativação, e qualquer edição de campo que não
-- muda a situação (cargo, setor, candidato, datas, etc.). Esta migration:
-- (1) adiciona `tipo_evento` para distinguir os três tipos de linha;
-- (2) enriquece o evento de situação com o motivo/candidato relevante;
-- (3) registra suspensão/reativação;
-- (4) registra qualquer edição de campo fora dos dois casos acima.

alter table public.historico_status
  add column tipo_evento text not null default 'situacao'
  check (tipo_evento in ('situacao', 'suspensao', 'edicao'));

create or replace function public.fn_registrar_historico_situacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_observacao text;
begin
  if (tg_op = 'INSERT') then
    insert into public.historico_status (vaga_id, situacao_anterior, situacao_nova, alterado_por)
    values (new.id, null, new.situacao, auth.uid());
    return new;
  end if;

  if (old.situacao is distinct from new.situacao) then
    v_observacao := case
      when new.situacao = 'fechado' then
        'Candidato(a): ' || coalesce(new.candidato_aprovado, '—')
          || ' · Admissão: ' || coalesce(to_char(new.data_admissao, 'DD/MM/YYYY'), '—')
      when new.situacao = 'cancelado' then new.observacoes
      else null
    end;

    insert into public.historico_status (vaga_id, situacao_anterior, situacao_nova, alterado_por, observacao)
    values (new.id, old.situacao, new.situacao, auth.uid(), v_observacao);
  end if;

  return new;
end;
$$;

create or replace function public.fn_registrar_historico_suspensao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (old.suspensa is distinct from new.suspensa) then
    insert into public.historico_status
      (vaga_id, situacao_anterior, situacao_nova, alterado_por, tipo_evento, observacao)
    values (
      new.id,
      new.situacao,
      new.situacao,
      auth.uid(),
      'suspensao',
      case
        when new.suspensa then 'Vaga suspensa' || case when new.motivo_suspensao is not null then ': ' || new.motivo_suspensao else '' end
        else 'Vaga reativada'
      end
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_vagas_historico_suspensao on public.vagas;
create trigger trg_vagas_historico_suspensao
after update of suspensa on public.vagas
for each row execute function public.fn_registrar_historico_suspensao();

create or replace function public.fn_registrar_historico_edicao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campos text[] := array[]::text[];
begin
  -- Mudanças de situação/suspensão já geram sua própria linha de histórico.
  if (old.situacao is distinct from new.situacao) or (old.suspensa is distinct from new.suspensa) then
    return new;
  end if;

  if old.numero_senior is distinct from new.numero_senior then v_campos := v_campos || 'nº Senior'; end if;
  if old.unidade_id is distinct from new.unidade_id then v_campos := v_campos || 'unidade'; end if;
  if old.cargo_id is distinct from new.cargo_id then v_campos := v_campos || 'cargo'; end if;
  if old.setor_id is distinct from new.setor_id then v_campos := v_campos || 'setor'; end if;
  if old.horario_trabalho is distinct from new.horario_trabalho then v_campos := v_campos || 'horário de trabalho'; end if;
  if old.gestor_id is distinct from new.gestor_id then v_campos := v_campos || 'gestor solicitante'; end if;
  if old.motivo is distinct from new.motivo then v_campos := v_campos || 'motivo'; end if;
  if old.justificativa is distinct from new.justificativa then v_campos := v_campos || 'justificativa'; end if;
  if old.data_abertura is distinct from new.data_abertura then v_campos := v_campos || 'data de abertura'; end if;
  if old.sla_dias is distinct from new.sla_dias then v_campos := v_campos || 'SLA (dias)'; end if;
  if old.candidato_aprovado is distinct from new.candidato_aprovado then v_campos := v_campos || 'candidato(a) aprovado(a)'; end if;
  if old.data_fechamento is distinct from new.data_fechamento then v_campos := v_campos || 'data de fechamento'; end if;
  if old.data_admissao is distinct from new.data_admissao then v_campos := v_campos || 'data de admissão'; end if;
  if old.recrutador_id is distinct from new.recrutador_id then v_campos := v_campos || 'recrutador(a)'; end if;

  if array_length(v_campos, 1) is null then
    return new;
  end if;

  insert into public.historico_status
    (vaga_id, situacao_anterior, situacao_nova, alterado_por, tipo_evento, observacao)
  values (
    new.id,
    new.situacao,
    new.situacao,
    auth.uid(),
    'edicao',
    'Campos alterados: ' || array_to_string(v_campos, ', ')
  );

  return new;
end;
$$;

drop trigger if exists trg_vagas_historico_edicao on public.vagas;
create trigger trg_vagas_historico_edicao
after update on public.vagas
for each row execute function public.fn_registrar_historico_edicao();
