-- Renomeia o papel admin_diretoria para diretoria, para abrir espaço para um
-- papel 'admin' superior (admin cria diretores; diretoria não cria admin).
alter type public.papel_usuario rename value 'admin_diretoria' to 'diretoria';
