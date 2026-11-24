-- Enquanto uma vaga de aumento de quadro está `pendente_aprovacao`, ela some
-- do campo de visão do recrutador (que não deve agir sobre uma vaga ainda não
-- liberada pela diretoria) mas continua visível para admin/diretoria e para o
-- próprio gestor que pediu.

create or replace function public.fn_is_recrutador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and papel = 'recrutador'
  );
$$;

drop policy if exists "vagas_select" on public.vagas;
create policy "vagas_select" on public.vagas for select to authenticated
  using (
    public.fn_has_unidade_access(unidade_id)
    and (
      public.fn_is_admin()
      or situacao <> 'pendente_aprovacao'
      or gestor_id = public.fn_my_funcionario_id()
    )
  );

drop policy if exists "vagas_update" on public.vagas;
create policy "vagas_update_admin" on public.vagas for update to authenticated
  using (public.fn_is_admin())
  with check (public.fn_is_admin());
create policy "vagas_update_recrutador" on public.vagas for update to authenticated
  using (
    public.fn_is_recrutador()
    and public.fn_has_unidade_access(unidade_id)
    and situacao <> 'pendente_aprovacao'
  )
  with check (
    public.fn_is_recrutador()
    and public.fn_has_unidade_access(unidade_id)
    and situacao <> 'pendente_aprovacao'
  );

-- Gestor já podia editar a própria solicitação enquanto em_aberto; passa a
-- poder editar também enquanto pendente_aprovacao (ela nasce nesse status
-- quando o motivo é aumento_de_quadro).
drop policy if exists "vagas_update_gestor" on public.vagas;
create policy "vagas_update_gestor" on public.vagas for update to authenticated
  using (gestor_id = public.fn_my_funcionario_id() and situacao in ('em_aberto', 'pendente_aprovacao'))
  with check (gestor_id = public.fn_my_funcionario_id() and situacao in ('em_aberto', 'pendente_aprovacao'));
