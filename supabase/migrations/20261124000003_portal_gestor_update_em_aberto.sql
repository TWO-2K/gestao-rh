-- Permite que o gestor edite os dados da própria solicitação (cargo, setor,
-- motivo, horário, justificativa) enquanto ela ainda estiver em_aberto. Depois
-- que o RH começa a tratar a vaga (fechada/cancelada), a edição é bloqueada.
create policy "vagas_update_gestor" on public.vagas for update to authenticated
  using (gestor_id = public.fn_my_funcionario_id() and situacao = 'em_aberto')
  with check (gestor_id = public.fn_my_funcionario_id() and situacao = 'em_aberto');
