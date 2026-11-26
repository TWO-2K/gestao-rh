-- Controle global de tipos de notificação: admin/diretoria liga/desliga um
-- tipo (ex.: "vaga_sla_vencendo") para todo o sistema. Ausência de linha para
-- um tipo = ativo (default true), então tipos novos não precisam de seed.
create table public.notificacao_tipo_config (
  tipo text primary key,
  ativo boolean not null default true,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references public.profiles(id)
);

alter table public.notificacao_tipo_config enable row level security;

create policy "notificacao_tipo_config_select_admin" on public.notificacao_tipo_config
  for select to authenticated
  using (public.fn_is_admin());

create policy "notificacao_tipo_config_insert_admin" on public.notificacao_tipo_config
  for insert to authenticated
  with check (public.fn_is_admin());

create policy "notificacao_tipo_config_update_admin" on public.notificacao_tipo_config
  for update to authenticated
  using (public.fn_is_admin())
  with check (public.fn_is_admin());

-- fn_criar_notificacao/fn_notificar_por_papel passam a checar esta tabela
-- antes de inserir, para que nenhum dos pontos de chamada existentes
-- (vagas.ts, migrations de SLA/experiência) precise mudar.
create or replace function public.fn_criar_notificacao(
  p_destinatario_id uuid,
  p_tipo text,
  p_titulo text,
  p_mensagem text,
  p_vaga_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if exists (select 1 from public.notificacao_tipo_config where tipo = p_tipo and ativo = false) then
    return null;
  end if;

  insert into public.notificacoes (destinatario_id, tipo, titulo, mensagem, vaga_id)
  values (p_destinatario_id, p_tipo, p_titulo, p_mensagem, p_vaga_id)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.fn_notificar_por_papel(
  p_papel public.papel_usuario,
  p_tipo text,
  p_titulo text,
  p_mensagem text,
  p_vaga_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.notificacao_tipo_config where tipo = p_tipo and ativo = false) then
    return;
  end if;

  insert into public.notificacoes (destinatario_id, tipo, titulo, mensagem, vaga_id)
  select id, p_tipo, p_titulo, p_mensagem, p_vaga_id
  from public.profiles
  where papel = p_papel;
end;
$$;
