-- Diretoria passa a ser somente-leitura em todo o sistema, exceto aprovar
-- /rejeitar vagas (migration anterior): não pode criar/editar/excluir
-- unidades, cargos, setores, funcionários, usuários ou vínculos de acesso.
-- Essas tabelas têm select liberado separadamente (policies *_select_auth,
-- "using (true)"), então restringir aqui as policies de escrita para
-- fn_is_super_admin() (só 'admin') não afeta a leitura da diretoria.

drop policy if exists "unidades_write_admin" on public.unidades;
create policy "unidades_write_admin" on public.unidades for all to authenticated
  using (public.fn_is_super_admin()) with check (public.fn_is_super_admin());

drop policy if exists "setores_write_admin" on public.setores;
create policy "setores_write_admin" on public.setores for all to authenticated
  using (public.fn_is_super_admin()) with check (public.fn_is_super_admin());

drop policy if exists "cargos_write_admin" on public.cargos;
create policy "cargos_write_admin" on public.cargos for all to authenticated
  using (public.fn_is_super_admin()) with check (public.fn_is_super_admin());

drop policy if exists "cargo_setor_write_admin" on public.cargo_setor;
create policy "cargo_setor_write_admin" on public.cargo_setor for all to authenticated
  using (public.fn_is_super_admin()) with check (public.fn_is_super_admin());

drop policy if exists "funcionarios_write_admin" on public.funcionarios;
create policy "funcionarios_write_admin" on public.funcionarios for all to authenticated
  using (public.fn_is_super_admin()) with check (public.fn_is_super_admin());

-- profiles/profile_unidades mantêm select próprio (self ou fn_is_admin, que
-- continua reconhecendo diretoria) — só a escrita fica restrita a admin.
drop policy if exists "profiles_write_admin" on public.profiles;
create policy "profiles_write_admin" on public.profiles for all to authenticated
  using (public.fn_is_super_admin()) with check (public.fn_is_super_admin());

drop policy if exists "profile_unidades_write_admin" on public.profile_unidades;
create policy "profile_unidades_write_admin" on public.profile_unidades for all to authenticated
  using (public.fn_is_super_admin()) with check (public.fn_is_super_admin());

-- Excluir vaga também é uma edição destrutiva fora do fluxo de aprovação.
drop policy if exists "vagas_delete_admin" on public.vagas;
create policy "vagas_delete_admin" on public.vagas for delete to authenticated
  using (public.fn_is_super_admin());
