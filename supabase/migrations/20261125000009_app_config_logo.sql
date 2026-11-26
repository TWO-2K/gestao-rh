-- Configurações globais do app (hoje só o logo da empresa, exibido no login e
-- na sidebar em vez do PNG fixo em public/brand/). Linha única (singleton,
-- truque do id boolean sempre true) editável só por admin/diretoria
-- (fn_is_admin(), ver 20261124000008_admin_role_rls.sql).
create table public.app_config (
  id boolean primary key default true,
  logo_path text,
  logo_atualizado_por uuid references public.profiles(id),
  logo_atualizado_em timestamptz,
  constraint app_config_singleton check (id)
);

insert into public.app_config (id) values (true);

alter table public.app_config enable row level security;

-- Select liberado pra todo mundo (autenticado ou não): a tela de login
-- precisa mostrar o logo sem sessão.
create policy "app_config_select_all" on public.app_config for select to anon, authenticated
  using (true);

create policy "app_config_update_admin" on public.app_config for update to authenticated
  using (public.fn_is_admin())
  with check (public.fn_is_admin());

-- Bucket público: o logo não é dado sensível, e público evita precisar gerar
-- URL assinada a cada carregamento de página (login, sidebar).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('branding', 'branding', true, 1048576, array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "storage_branding_insert_admin" on storage.objects for insert to authenticated
  with check (bucket_id = 'branding' and public.fn_is_admin());

create policy "storage_branding_update_admin" on storage.objects for update to authenticated
  using (bucket_id = 'branding' and public.fn_is_admin())
  with check (bucket_id = 'branding' and public.fn_is_admin());

create policy "storage_branding_delete_admin" on storage.objects for delete to authenticated
  using (bucket_id = 'branding' and public.fn_is_admin());
