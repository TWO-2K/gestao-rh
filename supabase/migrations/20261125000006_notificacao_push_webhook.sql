-- Push para a notificação de vencimento de experiência. Toda outra
-- notificação do app (vaga_fechada, vaga_cancelada, etc.) dispara o push na
-- mesma server action que chama fn_criar_notificacao (ver src/lib/actions/vagas.ts)
-- — mas a de vencimento de experiência nasce dentro do Postgres, via pg_cron
-- (20261125000005_notificacao_vencimento_experiencia.sql), sem nenhum
-- request Next.js em andamento para chamar enviarPush. Esse trigger fecha
-- essa lacuna: ao inserir uma notificacao desses dois tipos, usa pg_net para
-- chamar de volta uma rota da própria aplicação (src/app/api/cron/notificar-push)
-- que roda enviarPush (web-push, código Node — inacessível direto do Postgres).
--
-- Só cobre esses dois tipos de propósito: os demais já têm push garantido no
-- código TypeScript, e disparar daqui também duplicaria o envio.
create extension if not exists pg_net;

-- A role usada pelas migrations (`postgres`) não é superuser neste stack
-- local, e `alter database ... set app.*` para um GUC custom exige
-- superuser — por isso a URL/segredo ficam direto na função em vez de uma
-- setting de banco. host.docker.internal: do container do Postgres local até
-- o `next dev` no host. Em produção (fora do MVP local), troca por uma env
-- var lida de outro lugar com a URL pública do app.
create or replace function public.fn_notificar_push_notificacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tipo in ('experiencia_1_vencendo', 'experiencia_2_vencendo') then
    perform net.http_post(
      url := 'http://host.docker.internal:3000/api/cron/notificar-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', 'e4a10ecbb18242da76763840604f442008c1743f07a529af'
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

drop trigger if exists trg_notificacao_push on public.notificacoes;
create trigger trg_notificacao_push
  after insert on public.notificacoes
  for each row
  execute function public.fn_notificar_push_notificacao();
