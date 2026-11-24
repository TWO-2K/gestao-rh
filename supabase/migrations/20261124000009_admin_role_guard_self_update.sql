-- A policy profiles_update_self permite que qualquer usuário atualize o
-- próprio perfil sem checar o que está sendo alterado, então um diretoria
-- conseguia se autopromover a admin (ou alterar funcionario_id) direto via
-- REST, ignorando a regra de "diretoria não cria/edita admin". Um trigger
-- garante a regra independente de qual policy permitiu a linha passar.
--
-- Contexto de service role (server actions com createAdminClient) não tem
-- auth.uid() e é tratado como confiável — a regra de negócio já é aplicada
-- em código (src/lib/actions/usuarios.ts).
create or replace function public.fn_guard_profiles_papel_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_papel public.papel_usuario;
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.papel is distinct from old.papel or new.funcionario_id is distinct from old.funcionario_id then
    select papel into acting_papel from public.profiles where id = auth.uid();

    if acting_papel is null or acting_papel not in ('admin', 'diretoria') then
      raise exception 'Sem permissão para alterar papel ou funcionário vinculado.';
    end if;

    if acting_papel = 'diretoria' and (new.papel = 'admin' or old.papel = 'admin') then
      raise exception 'Diretoria não pode criar ou alterar usuários administradores.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_profiles_papel_change on public.profiles;
create trigger trg_guard_profiles_papel_change
before update on public.profiles
for each row execute function public.fn_guard_profiles_papel_change();

-- A regra fina acima substitui a necessidade de fn_is_super_admin() distinguir
-- quem escreve em profiles; mantém-se fn_is_admin() simples para a policy.
drop policy if exists "profiles_write_admin" on public.profiles;
create policy "profiles_write_admin" on public.profiles for all to authenticated
  using (public.fn_is_admin()) with check (public.fn_is_admin());
