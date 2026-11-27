-- Um recrutador deve sempre ver as próprias vagas (recrutador_id = ele), mesmo
-- quando a unidade dela não está mais (ou nunca esteve) no acesso dele via
-- profile_unidades. Sem isso, a tela "Desempenho" mostra números diferentes
-- para o próprio recrutador e para admin/diretoria olhando a mesma pessoa,
-- porque a RLS corta linhas de unidade fora do acesso atual dele antes mesmo
-- de a agregação em JS rodar.
--
-- Importante: isso amplia só a VISIBILIDADE de leitura das vagas que já são
-- dele (não dá acesso a outras vagas da mesma unidade, nem altera a policy de
-- update/delete — ele continua sem poder agir sobre vaga fora do seu acesso
-- de unidade, só visualizar o próprio histórico).

drop policy if exists "vagas_select" on public.vagas;
create policy "vagas_select" on public.vagas for select to authenticated
  using (
    (
      public.fn_has_unidade_access(unidade_id)
      and (
        public.fn_is_admin()
        or situacao <> 'pendente_aprovacao'
        or gestor_id = public.fn_my_funcionario_id()
      )
    )
    or recrutador_id = auth.uid()
  );
