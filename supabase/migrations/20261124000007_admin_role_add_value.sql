-- Novo valor de enum precisa de migration própria: não pode ser adicionado e
-- usado (ex.: em uma expressão de RLS) na mesma transação.
alter type public.papel_usuario add value 'admin';
