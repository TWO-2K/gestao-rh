-- Ajusta a janela de transição que a diretoria pode fazer numa vaga
-- pendente de aprovação: rejeitar agora leva a 'rejeitado', não mais
-- 'cancelado' (ver 20261126000014_vaga_rejeitado_enum.sql).
drop policy if exists "vagas_update_diretoria" on public.vagas;
create policy "vagas_update_diretoria" on public.vagas for update to authenticated
  using (
    public.fn_is_admin()
    and not public.fn_is_super_admin()
    and situacao = 'pendente_aprovacao'
  )
  with check (
    public.fn_is_admin()
    and not public.fn_is_super_admin()
    and situacao in ('em_aberto', 'rejeitado')
  );

create or replace function public.fn_guard_vagas_update_diretoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_papel public.papel_usuario;
begin
  select papel into acting_papel from public.profiles where id = auth.uid();

  if acting_papel = 'diretoria' then
    if old.situacao is distinct from new.situacao
      and (old.situacao <> 'pendente_aprovacao' or new.situacao not in ('em_aberto', 'rejeitado'))
    then
      raise exception 'Diretoria só pode aprovar (em_aberto) ou rejeitar (rejeitado) uma vaga pendente de aprovação';
    end if;

    if new.numero_senior is distinct from old.numero_senior
      or new.unidade_id is distinct from old.unidade_id
      or new.cargo_id is distinct from old.cargo_id
      or new.setor_id is distinct from old.setor_id
      or new.horario_trabalho is distinct from old.horario_trabalho
      or new.gestor_id is distinct from old.gestor_id
      or new.motivo is distinct from old.motivo
      or new.justificativa is distinct from old.justificativa
      or new.data_abertura is distinct from old.data_abertura
      or new.sla_dias is distinct from old.sla_dias
      or new.candidato_aprovado is distinct from old.candidato_aprovado
      or new.data_fechamento is distinct from old.data_fechamento
      or new.data_admissao is distinct from old.data_admissao
      or new.recrutador_id is distinct from old.recrutador_id
      or new.suspensa is distinct from old.suspensa
      or new.motivo_suspensao is distinct from old.motivo_suspensao
    then
      raise exception 'Diretoria não pode alterar dados da vaga, apenas aprovar ou rejeitar';
    end if;
  end if;

  return new;
end;
$$;
