-- Registra o resultado (não só a data-limite) de cada período de experiência
-- (45/90 dias). Sem isso, o alerta de vencimento ficava vermelho pra sempre em
-- vagas fechadas, mesmo depois do RH já ter decidido efetivar ou desligar.
create type public.status_experiencia as enum ('pendente', 'aprovado', 'reprovado');

alter table public.vagas
  add column experiencia_1_status public.status_experiencia not null default 'pendente',
  add column experiencia_2_status public.status_experiencia not null default 'pendente';
