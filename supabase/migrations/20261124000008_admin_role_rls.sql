-- fn_is_admin() passa a reconhecer os dois papéis administrativos (admin e
-- diretoria) para tudo que já era admin-only (unidades, cargos, cadastros,
-- usuários etc.). fn_is_super_admin() distingue só o papel 'admin', usado
-- para impedir que diretoria crie ou promova alguém para admin.
create or replace function public.fn_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and papel in ('admin', 'diretoria')
  );
$$;

create or replace function public.fn_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and papel = 'admin'
  );
$$;

drop policy "profiles_write_admin" on public.profiles;
create policy "profiles_write_admin" on public.profiles for all to authenticated
  using (public.fn_is_super_admin() or (public.fn_is_admin() and papel <> 'admin'))
  with check (public.fn_is_super_admin() or (public.fn_is_admin() and papel <> 'admin'));
