-- Novo papel 'gerente': responsável pela unidade, hierarquicamente acima do
-- gestor (que solicita vagas). Ainda sem regras de permissão próprias (RLS) —
-- por enquanto só o papel em si, para já poder ser atribuído a um usuário.
-- Valor de enum precisa de migration própria: não pode ser adicionado e usado
-- (ex.: em uma expressão de RLS) na mesma transação.
alter type public.papel_usuario add value 'gerente';
