-- fn_registrar_historico_edicao() (20261125000013) monta v_campos com
-- `v_campos := v_campos || 'literal'`. Sem cast explícito, o Postgres resolve
-- esse `||` como `anyarray || anyarray` e tenta fazer array_in('literal'),
-- falhando com "malformed array literal" para QUALQUER literal (não só os com
-- parênteses). Isso nunca tinha disparado porque toda edição rastreada até
-- hoje vinha junto com mudança de `situacao`/`suspensa`, que já retorna antes
-- dessas linhas. `assumirVaga`/`liberarVaga` (Fase 5.6) foram as primeiras
-- ações a mudar só `recrutador_id` sozinho, expondo o bug.
create or replace function public.fn_registrar_historico_edicao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campos text[] := array[]::text[];
begin
  if (old.situacao is distinct from new.situacao) or (old.suspensa is distinct from new.suspensa) then
    return new;
  end if;

  if old.numero_senior is distinct from new.numero_senior then v_campos := v_campos || 'nº Senior'::text; end if;
  if old.unidade_id is distinct from new.unidade_id then v_campos := v_campos || 'unidade'::text; end if;
  if old.cargo_id is distinct from new.cargo_id then v_campos := v_campos || 'cargo'::text; end if;
  if old.setor_id is distinct from new.setor_id then v_campos := v_campos || 'setor'::text; end if;
  if old.horario_trabalho is distinct from new.horario_trabalho then v_campos := v_campos || 'horário de trabalho'::text; end if;
  if old.gestor_id is distinct from new.gestor_id then v_campos := v_campos || 'gestor solicitante'::text; end if;
  if old.motivo is distinct from new.motivo then v_campos := v_campos || 'motivo'::text; end if;
  if old.justificativa is distinct from new.justificativa then v_campos := v_campos || 'justificativa'::text; end if;
  if old.data_abertura is distinct from new.data_abertura then v_campos := v_campos || 'data de abertura'::text; end if;
  if old.sla_dias is distinct from new.sla_dias then v_campos := v_campos || 'SLA (dias)'::text; end if;
  if old.candidato_aprovado is distinct from new.candidato_aprovado then v_campos := v_campos || 'candidato(a) aprovado(a)'::text; end if;
  if old.data_fechamento is distinct from new.data_fechamento then v_campos := v_campos || 'data de fechamento'::text; end if;
  if old.data_admissao is distinct from new.data_admissao then v_campos := v_campos || 'data de admissão'::text; end if;
  if old.recrutador_id is distinct from new.recrutador_id then v_campos := v_campos || 'recrutador(a)'::text; end if;

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
