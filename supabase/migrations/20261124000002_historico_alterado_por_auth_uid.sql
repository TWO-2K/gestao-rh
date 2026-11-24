-- O histórico de situação usava new.recrutador_id como "alterado_por", mas vagas
-- criadas pelo gestor (portal-gestor) não preenchem recrutador_id, então a linha de
-- histórico ficava sem autoria. auth.uid() identifica quem realizou a ação (gestor,
-- recrutador ou admin) independente do papel, sem reaproveitar um campo de negócio.
create or replace function public.fn_registrar_historico_situacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.historico_status (vaga_id, situacao_anterior, situacao_nova, alterado_por)
    values (new.id, null, new.situacao, auth.uid());
  elsif (old.situacao is distinct from new.situacao) then
    insert into public.historico_status (vaga_id, situacao_anterior, situacao_nova, alterado_por)
    values (new.id, old.situacao, new.situacao, auth.uid());
  end if;
  return new;
end;
$$;
