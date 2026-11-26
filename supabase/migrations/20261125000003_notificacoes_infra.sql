-- Infraestrutura genérica de notificações in-app. Nenhum evento é ligado ainda
-- (nenhuma action/trigger existente passa a chamar isto) — esta migration só cria
-- a tabela, as primitivas de criação e a RLS. A escolha de quais eventos (aprovação,
-- fechamento, rejeição...) vão gerar notificação fica para uma fase seguinte.
--
-- `tipo` é texto livre, não enum: ao contrário de `situacao_vaga`/`papel_usuario`,
-- o conjunto de tipos de notificação ainda não foi decidido e vai crescer aos poucos
-- — um enum do Postgres exigiria uma migration própria por valor novo (como em
-- 20261124000010_vaga_pendente_aprovacao_enum.sql). A validação do conjunto de tipos
-- válidos fica só no TypeScript.
create table public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  destinatario_id uuid not null references public.profiles(id) on delete cascade,
  tipo text not null,
  titulo text not null,
  mensagem text not null,
  vaga_id uuid references public.vagas(id) on delete cascade,
  lida boolean not null default false,
  lida_em timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notificacoes_destinatario on public.notificacoes (destinatario_id, lida, created_at desc);

alter table public.notificacoes enable row level security;

create policy "notificacoes_select" on public.notificacoes for select to authenticated
  using (destinatario_id = auth.uid());

create policy "notificacoes_update" on public.notificacoes for update to authenticated
  using (destinatario_id = auth.uid()) with check (destinatario_id = auth.uid());

-- Sem policy de insert para usuários autenticados: a única forma de criar uma
-- notificação é via fn_criar_notificacao (security definer), que ignora RLS.
-- Isso impede qualquer usuário de inserir notificação em nome de outro via REST.

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
  insert into public.notificacoes (destinatario_id, tipo, titulo, mensagem, vaga_id)
  values (p_destinatario_id, p_tipo, p_titulo, p_mensagem, p_vaga_id)
  returning id into v_id;
  return v_id;
end;
$$;

-- Atalho para notificar todo mundo de um papel (ex.: todos admin/diretoria de uma
-- vez). Nenhum trigger chama isso ainda — fica disponível para quando o evento for ligado.
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
  insert into public.notificacoes (destinatario_id, tipo, titulo, mensagem, vaga_id)
  select id, p_tipo, p_titulo, p_mensagem, p_vaga_id
  from public.profiles
  where papel = p_papel;
end;
$$;
