-- Backfill: usuários promovidos antes da coluna funcionarios.email existir não tiveram
-- o e-mail copiado para o funcionário vinculado. Preenche a partir de auth.users.
update public.funcionarios f
set email = u.email
from public.profiles p
join auth.users u on u.id = p.id
where p.funcionario_id = f.id
  and f.email is null
  and u.email is not null;
