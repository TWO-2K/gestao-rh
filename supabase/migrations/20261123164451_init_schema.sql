-- Sistema Unificado de RH (+B Mais Barato / +B Farma)
-- Esquema inicial: unidades, catálogo de cargos/setores, vagas e histórico.

create extension if not exists pgcrypto;

-- ========== ENUMS ==========

create type public.papel_usuario as enum ('admin_diretoria', 'recrutador');
create type public.motivo_vaga as enum ('substituicao', 'aumento_de_quadro');
create type public.situacao_vaga as enum ('em_aberto', 'fechado', 'cancelado');

-- ========== TABELAS DE REFERÊNCIA ==========

create table public.unidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  codigo text unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.setores (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

create table public.cargos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

-- Combinações válidas cargo+setor (um cargo pode existir em mais de um setor,
-- ex.: "OPERADOR DE LOJA" em FRIOS, SALÃO, CÂMARA etc.)
create table public.cargo_setor (
  cargo_id uuid not null references public.cargos(id) on delete cascade,
  setor_id uuid not null references public.setores(id) on delete cascade,
  primary key (cargo_id, setor_id)
);

-- ========== USUÁRIOS ==========

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  papel public.papel_usuario not null default 'recrutador',
  created_at timestamptz not null default now()
);

-- Unidades que cada recrutador(a) pode acessar (admin_diretoria enxerga todas, independente desta tabela)
create table public.profile_unidades (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  unidade_id uuid not null references public.unidades(id) on delete cascade,
  primary key (profile_id, unidade_id)
);

-- ========== VAGAS ==========

create sequence public.vagas_numero_seq;

create table public.vagas (
  id uuid primary key default gen_random_uuid(),
  numero integer not null default nextval('public.vagas_numero_seq') unique,
  numero_senior text,
  unidade_id uuid not null references public.unidades(id),
  cargo_id uuid not null references public.cargos(id),
  setor_id uuid not null references public.setores(id),
  horario_trabalho text,
  gestor_solicitante text,
  motivo public.motivo_vaga not null,
  justificativa text,
  data_abertura date not null default current_date,
  sla_dias integer not null default 20,
  situacao public.situacao_vaga not null default 'em_aberto',
  previsao_fechamento date generated always as ((data_abertura + (sla_dias * interval '1 day'))::date) stored,
  candidato_aprovado text,
  data_fechamento date,
  data_admissao date,
  periodo_experiencia_1 date generated always as (data_admissao + 45) stored,
  periodo_experiencia_2 date generated always as (data_admissao + 90) stored,
  recrutador_id uuid references public.profiles(id),
  data_cancelamento date,
  observacoes text,
  suspensa boolean not null default false,
  motivo_suspensao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_vagas_unidade on public.vagas (unidade_id);
create index idx_vagas_situacao on public.vagas (situacao);
create index idx_vagas_recrutador on public.vagas (recrutador_id);

-- Histórico de mudança de situação (auditoria — não existia nas planilhas)
create table public.historico_status (
  id uuid primary key default gen_random_uuid(),
  vaga_id uuid not null references public.vagas(id) on delete cascade,
  situacao_anterior public.situacao_vaga,
  situacao_nova public.situacao_vaga not null,
  alterado_por uuid references public.profiles(id),
  alterado_em timestamptz not null default now(),
  observacao text
);

create index idx_historico_vaga on public.historico_status (vaga_id);

-- View com os campos calculados que hoje são fórmulas manuais na planilha.
-- security_invoker garante que a RLS da tabela vagas seja respeitada por quem consulta a view.
create view public.vagas_detalhada
with (security_invoker = true)
as
select
  v.*,
  case
    when v.situacao = 'cancelado' then null
    else (coalesce(v.data_fechamento, current_date) - v.data_abertura)
  end as dias_em_aberto,
  case
    when v.suspensa then 'suspenso'
    when v.situacao = 'cancelado' then null
    when (coalesce(v.data_fechamento, current_date) - v.data_abertura) > v.sla_dias then 'em_atraso'
    else 'no_prazo'
  end as status_sla,
  u.nome as unidade_nome,
  c.nome as cargo_nome,
  s.nome as setor_nome,
  p.nome as recrutador_nome
from public.vagas v
join public.unidades u on u.id = v.unidade_id
join public.cargos c on c.id = v.cargo_id
join public.setores s on s.id = v.setor_id
left join public.profiles p on p.id = v.recrutador_id;

-- ========== FUNÇÕES AUXILIARES ==========

create or replace function public.fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_vagas_updated_at
before update on public.vagas
for each row execute function public.fn_set_updated_at();

create or replace function public.fn_registrar_historico_situacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.historico_status (vaga_id, situacao_anterior, situacao_nova, alterado_por)
    values (new.id, null, new.situacao, new.recrutador_id);
  elsif (old.situacao is distinct from new.situacao) then
    insert into public.historico_status (vaga_id, situacao_anterior, situacao_nova, alterado_por)
    values (new.id, old.situacao, new.situacao, new.recrutador_id);
  end if;
  return new;
end;
$$;

create trigger trg_vagas_historico
after insert or update of situacao on public.vagas
for each row execute function public.fn_registrar_historico_situacao();

-- Cria o profile automaticamente quando um usuário se cadastra no Supabase Auth
create or replace function public.fn_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, papel)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    coalesce((new.raw_user_meta_data->>'papel')::public.papel_usuario, 'recrutador')
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
after insert on auth.users
for each row execute function public.fn_handle_new_user();

-- ========== RLS ==========

create or replace function public.fn_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and papel = 'admin_diretoria'
  );
$$;

create or replace function public.fn_has_unidade_access(p_unidade_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.fn_is_admin() or exists (
    select 1 from public.profile_unidades pu
    where pu.profile_id = auth.uid() and pu.unidade_id = p_unidade_id
  );
$$;

alter table public.unidades enable row level security;
alter table public.setores enable row level security;
alter table public.cargos enable row level security;
alter table public.cargo_setor enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_unidades enable row level security;
alter table public.vagas enable row level security;
alter table public.historico_status enable row level security;

-- Dados de referência: qualquer usuário autenticado pode ler; só admin escreve
create policy "unidades_select_auth" on public.unidades for select to authenticated using (true);
create policy "unidades_write_admin" on public.unidades for all to authenticated
  using (public.fn_is_admin()) with check (public.fn_is_admin());

create policy "setores_select_auth" on public.setores for select to authenticated using (true);
create policy "setores_write_admin" on public.setores for all to authenticated
  using (public.fn_is_admin()) with check (public.fn_is_admin());

create policy "cargos_select_auth" on public.cargos for select to authenticated using (true);
create policy "cargos_write_admin" on public.cargos for all to authenticated
  using (public.fn_is_admin()) with check (public.fn_is_admin());

create policy "cargo_setor_select_auth" on public.cargo_setor for select to authenticated using (true);
create policy "cargo_setor_write_admin" on public.cargo_setor for all to authenticated
  using (public.fn_is_admin()) with check (public.fn_is_admin());

-- Perfis: cada um vê o próprio; admin vê todos
create policy "profiles_select_self_or_admin" on public.profiles for select to authenticated
  using (id = auth.uid() or public.fn_is_admin());
create policy "profiles_update_self" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_write_admin" on public.profiles for all to authenticated
  using (public.fn_is_admin()) with check (public.fn_is_admin());

create policy "profile_unidades_select" on public.profile_unidades for select to authenticated
  using (profile_id = auth.uid() or public.fn_is_admin());
create policy "profile_unidades_write_admin" on public.profile_unidades for all to authenticated
  using (public.fn_is_admin()) with check (public.fn_is_admin());

-- Vagas: recrutador só vê/edita vagas das unidades liberadas para ele; admin vê tudo
create policy "vagas_select" on public.vagas for select to authenticated
  using (public.fn_has_unidade_access(unidade_id));
create policy "vagas_insert" on public.vagas for insert to authenticated
  with check (public.fn_has_unidade_access(unidade_id));
create policy "vagas_update" on public.vagas for update to authenticated
  using (public.fn_has_unidade_access(unidade_id)) with check (public.fn_has_unidade_access(unidade_id));
create policy "vagas_delete_admin" on public.vagas for delete to authenticated
  using (public.fn_is_admin());

create policy "historico_select" on public.historico_status for select to authenticated
  using (exists (
    select 1 from public.vagas v where v.id = vaga_id and public.fn_has_unidade_access(v.unidade_id)
  ));

grant select on public.vagas_detalhada to authenticated;
