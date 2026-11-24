-- E-mail é um dado do funcionário, não da conta de acesso: passa a ser cadastrado
-- junto com a pessoa em Cadastros → Funcionários e reaproveitado na promoção a usuário.
alter table public.funcionarios add column email text;
