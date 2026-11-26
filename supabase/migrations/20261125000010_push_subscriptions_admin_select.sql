-- Permite admin/diretoria listar quem tem notificação push ativada no sistema
-- (tela de Configurações), sem abrir a tabela toda via a policy de dono já
-- existente (push_subscriptions_select, restrita a profile_id = auth.uid()).
create policy "push_subscriptions_select_admin" on public.push_subscriptions for select to authenticated
  using (fn_is_admin());
