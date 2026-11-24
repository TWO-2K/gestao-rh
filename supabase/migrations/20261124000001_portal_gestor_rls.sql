-- Portal do Gestor: um gestor autenticado só pode ver e abrir solicitações de
-- vaga em seu próprio nome (gestor_id = o funcionário vinculado ao seu profile),
-- dentro da própria unidade. Ele não ganha acesso de unidade via
-- fn_has_unidade_access/profile_unidades como recrutador/admin.

create or replace function public.fn_my_funcionario_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select funcionario_id from public.profiles where id = auth.uid();
$$;

create or replace function public.fn_is_my_unidade(p_unidade_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.funcionarios f on f.id = p.funcionario_id
    where p.id = auth.uid() and f.unidade_id = p_unidade_id
  );
$$;

create policy "vagas_select_gestor" on public.vagas for select to authenticated
  using (gestor_id = public.fn_my_funcionario_id());

create policy "vagas_insert_gestor" on public.vagas for insert to authenticated
  with check (
    gestor_id = public.fn_my_funcionario_id()
    and public.fn_is_my_unidade(unidade_id)
  );
