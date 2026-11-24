-- Portal do Gestor: novo papel de usuário para gestores solicitantes de vaga.
-- O valor precisa ser adicionado em uma migration própria (não pode ser usado
-- em expressões, como as policies de RLS, na mesma transação em que é criado).

alter type public.papel_usuario add value 'gestor';
