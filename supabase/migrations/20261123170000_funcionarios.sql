-- Funcionários: cadastro único de pessoas do grupo (gestores, etc.), com ou sem
-- acesso ao sistema. Substitui o campo de texto livre "gestor_solicitante" em vagas
-- e permite, no futuro, vincular uma conta de login (profiles) a um funcionário já
-- cadastrado, sem duplicar nome/unidade.

create table public.funcionarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  unidade_id uuid references public.unidades(id),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_funcionarios_unidade on public.funcionarios (unidade_id);

alter table public.funcionarios enable row level security;

create policy "funcionarios_select_auth" on public.funcionarios for select to authenticated using (true);
create policy "funcionarios_write_admin" on public.funcionarios for all to authenticated
  using (public.fn_is_admin()) with check (public.fn_is_admin());

-- Uma conta de acesso (profile) pode, opcionalmente, estar vinculada a um funcionário
-- já cadastrado (ex.: quando um gestor passa a precisar logar no sistema).
alter table public.profiles add column funcionario_id uuid references public.funcionarios(id);

-- Vagas: troca o texto livre "gestor_solicitante" por referência a funcionários.
drop view public.vagas_detalhada;

alter table public.vagas add column gestor_id uuid references public.funcionarios(id);
alter table public.vagas drop column gestor_solicitante;

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
  p.nome as recrutador_nome,
  g.nome as gestor_nome
from public.vagas v
join public.unidades u on u.id = v.unidade_id
join public.cargos c on c.id = v.cargo_id
join public.setores s on s.id = v.setor_id
left join public.profiles p on p.id = v.recrutador_id
left join public.funcionarios g on g.id = v.gestor_id;

grant select on public.vagas_detalhada to authenticated;
