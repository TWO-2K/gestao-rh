-- Assinatura do funcionário: cada um pode desenhar e cadastrar a própria assinatura
-- (ex.: pra uso futuro em documentos/checklists assinados), sem depender do RH pra
-- isso. O arquivo (PNG) fica no bucket privado 'assinaturas', em
-- funcionarios/<funcionario_id>/..., e o caminho é guardado em
-- funcionarios.assinatura_path; a URL exibida é assinada (bucket privado) e gerada
-- sob demanda ao carregar a tela.

alter table public.funcionarios add column assinatura_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('assinaturas', 'assinaturas', false, 524288, array['image/png'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "storage_assinaturas_select_auth" on storage.objects for select to authenticated
  using (bucket_id = 'assinaturas');

create policy "storage_assinaturas_insert_own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'assinaturas'
    and (storage.foldername(name))[1] = 'funcionarios'
    and (storage.foldername(name))[2] = public.fn_my_funcionario_id()::text
  );

create policy "storage_assinaturas_update_own" on storage.objects for update to authenticated
  using (
    bucket_id = 'assinaturas'
    and (storage.foldername(name))[1] = 'funcionarios'
    and (storage.foldername(name))[2] = public.fn_my_funcionario_id()::text
  )
  with check (
    bucket_id = 'assinaturas'
    and (storage.foldername(name))[1] = 'funcionarios'
    and (storage.foldername(name))[2] = public.fn_my_funcionario_id()::text
  );

create policy "storage_assinaturas_delete_own" on storage.objects for delete to authenticated
  using (
    bucket_id = 'assinaturas'
    and (storage.foldername(name))[1] = 'funcionarios'
    and (storage.foldername(name))[2] = public.fn_my_funcionario_id()::text
  );

-- funcionarios só tem policy de escrita pro admin (funcionarios_write_admin); o próprio
-- funcionário não pode dar update na própria linha. Em vez de abrir mais uma policy de
-- update (que liberaria qualquer coluna, não só a assinatura), essas funções fazem só
-- essa troca pontual, sempre restrita ao funcionário vinculado ao usuário logado.

create or replace function public.fn_definir_minha_assinatura(p_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_funcionario_id uuid := public.fn_my_funcionario_id();
begin
  if v_funcionario_id is null then
    raise exception 'Seu usuário não está vinculado a um funcionário.';
  end if;

  update public.funcionarios set assinatura_path = p_path where id = v_funcionario_id;
end;
$$;

revoke all on function public.fn_definir_minha_assinatura(text) from public;
grant execute on function public.fn_definir_minha_assinatura(text) to authenticated;

create or replace function public.fn_remover_minha_assinatura()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_funcionario_id uuid := public.fn_my_funcionario_id();
  v_path text;
begin
  if v_funcionario_id is null then
    raise exception 'Seu usuário não está vinculado a um funcionário.';
  end if;

  select assinatura_path into v_path from public.funcionarios where id = v_funcionario_id;
  update public.funcionarios set assinatura_path = null where id = v_funcionario_id;
  return v_path;
end;
$$;

revoke all on function public.fn_remover_minha_assinatura() from public;
grant execute on function public.fn_remover_minha_assinatura() to authenticated;
