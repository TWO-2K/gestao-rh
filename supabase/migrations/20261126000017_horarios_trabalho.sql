-- Hoje "horário de trabalho" é texto livre em vagas.horario_trabalho, sem
-- nenhum catálogo — cada pessoa digita como quiser. Transforma em cadastro
-- próprio (igual setores/cargos), editável em Cadastros, e muda vagas para
-- referenciar por FK.

create table public.horarios_trabalho (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

alter table public.horarios_trabalho enable row level security;

create policy "horarios_trabalho_select_auth" on public.horarios_trabalho
  for select to authenticated using (true);
create policy "horarios_trabalho_write_admin" on public.horarios_trabalho
  for all to authenticated
  using (public.fn_is_super_admin()) with check (public.fn_is_super_admin());

-- Migra os valores de texto livre já usados em vagas para o novo cadastro,
-- preservando o histórico (um registro por valor distinto já digitado).
insert into public.horarios_trabalho (nome)
select distinct trim(horario_trabalho)
from public.vagas
where horario_trabalho is not null and trim(horario_trabalho) <> ''
on conflict (nome) do nothing;

alter table public.vagas add column horario_trabalho_id uuid references public.horarios_trabalho(id);

update public.vagas v
set horario_trabalho_id = h.id
from public.horarios_trabalho h
where v.horario_trabalho is not null
  and trim(v.horario_trabalho) <> ''
  and h.nome = trim(v.horario_trabalho);

drop view public.vagas_detalhada;

alter table public.vagas drop column horario_trabalho;

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
  h.nome as horario_trabalho_nome,
  p.nome as recrutador_nome,
  g.nome as gestor_nome
from public.vagas v
join public.unidades u on u.id = v.unidade_id
join public.cargos c on c.id = v.cargo_id
join public.setores s on s.id = v.setor_id
left join public.horarios_trabalho h on h.id = v.horario_trabalho_id
left join public.profiles p on p.id = v.recrutador_id
left join public.funcionarios g on g.id = v.gestor_id;

grant select on public.vagas_detalhada to authenticated;
