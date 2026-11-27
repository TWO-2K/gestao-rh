-- fn_notificar_push_notificacao() (20261125000006/7/8) chamava de volta a
-- aplicação via pg_net com URL e secret hardcoded no SQL:
-- 'http://host.docker.internal:3000/...' só resolve dentro do Docker local
-- (é como o Postgres do stack local enxerga o `next dev` no host) e nunca vai
-- existir em produção, além do secret ficar em texto puro no histórico de
-- migrations. Move os dois pra Supabase Vault (segredos criptografados,
-- disponível tanto local quanto em projetos hospedados), lidos em runtime via
-- vault.decrypted_secrets em vez de valores fixos na função.
--
-- Os segredos em si (URL + secret) não ficam no SQL: são gerenciados pela
-- seção [db.vault] de supabase/config.toml, que lê de APP_WEBHOOK_URL e
-- CRON_SECRET (variáveis de ambiente, nunca commitadas) e sincroniza o Vault
-- automaticamente em todo `supabase db push`/`db reset`. Essa migration só
-- garante que a extensão existe e que a função lê os nomes certos.
create extension if not exists supabase_vault;

create or replace function public.fn_notificar_push_notificacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text;
  v_secret text;
begin
  if new.tipo in ('experiencia_1_vencendo', 'experiencia_2_vencendo', 'vaga_sla_vencendo', 'vaga_sla_atrasada') then
    select decrypted_secret into v_url from vault.decrypted_secrets where name = 'app_webhook_url';
    select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'cron_secret';

    perform net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', v_secret
      ),
      body := jsonb_build_object(
        'destinatario_id', new.destinatario_id,
        'titulo', new.titulo,
        'mensagem', new.mensagem,
        'url', '/notificacoes'
      )
    );
  end if;
  return new;
end;
$$;
