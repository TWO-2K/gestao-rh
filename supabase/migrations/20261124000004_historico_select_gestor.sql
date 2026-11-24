-- A policy de select de historico_status só considerava acesso por unidade
-- (fn_has_unidade_access), que o gestor não tem — por isso o histórico da
-- própria solicitação aparecia vazio para ele. Libera também quando a vaga é
-- a do próprio gestor.
create policy "historico_select_gestor" on public.historico_status for select to authenticated
  using (exists (
    select 1 from public.vagas v
    where v.id = vaga_id and v.gestor_id = public.fn_my_funcionario_id()
  ));
