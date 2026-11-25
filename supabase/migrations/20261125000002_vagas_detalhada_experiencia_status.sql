-- A view "vagas_detalhada" usa "v.*", mas o Postgres congela a lista de
-- colunas no momento da criação: as duas colunas novas de
-- supabase/migrations/20261125000001_status_experiencia.sql não entram
-- sozinhas, é preciso recriar a view.
drop view public.vagas_detalhada;

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
