-- Assinaturas de push do navegador (Web Push API), uma por dispositivo/navegador
-- em que o usuário autorizou notificações. O envio em si (via `web-push` no servidor,
-- usando as chaves VAPID) acontece fora do banco; esta tabela só guarda o endereço
-- de entrega de cada dispositivo e a RLS garante que cada usuário só vê/apaga as suas.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (endpoint)
);

create index idx_push_subscriptions_profile on public.push_subscriptions (profile_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select" on public.push_subscriptions for select to authenticated
  using (profile_id = auth.uid());

create policy "push_subscriptions_insert" on public.push_subscriptions for insert to authenticated
  with check (profile_id = auth.uid());

create policy "push_subscriptions_delete" on public.push_subscriptions for delete to authenticated
  using (profile_id = auth.uid());

-- Sem policy de update: para renovar uma subscription o client remove e cria outra.
