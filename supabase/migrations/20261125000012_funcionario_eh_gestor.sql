-- Marca quem é gestor/diretor no cadastro de funcionários, para restringir o
-- select "Gestor solicitante" (ao abrir vaga) a essas pessoas, em vez de
-- listar todo funcionário ativo da unidade.

alter table public.funcionarios add column eh_gestor boolean not null default false;
