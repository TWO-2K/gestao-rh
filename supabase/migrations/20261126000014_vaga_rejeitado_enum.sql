-- Hoje rejeitarVaga() usa `situacao = 'cancelado'` para uma vaga pendente de
-- aprovação rejeitada pela diretoria, misturando com o caso de uma vaga
-- aberta cancelada depois. Separamos em um status próprio.
alter type public.situacao_vaga add value 'rejeitado';
