# Sistema Unificado de RH — Grupo +B (Mais Barato / +B Farma)

## Contexto

A equipe de RH ("Lanna RH") controla hoje as vagas abertas de 8 unidades do grupo (Alcindo Cacela, CD Corporativo, MB Food, Obra, Plaza/Villa Plaza, Matriz, CD Logística, Grão Pará) cada uma em uma planilha Excel separada, mais uma 9ª planilha ("Mapa geral Unificado P Diretoria") que é montada manualmente a partir das outras para apresentar à diretoria. Isso gera retrabalho (a mesma vaga é digitada em até 3 abas diferentes: "Mapa", "Radar de vagas" e, em algumas unidades, "Fechamento"), cálculos de prazo feitos manualmente, e risco de inconsistência entre a planilha de cada loja e a consolidada da diretoria.

Inspecionei as 9 planilhas reais (via COM do Excel, leitura apenas) e a estrutura é consistente entre todas: cada unidade tem uma aba "Mapa" com o requisição de vaga completa, uma aba "Radar de vagas" (visão quase duplicada, com nº do sistema Senior), uma aba oculta "CARGOS PARA AUTOMATIZAÇÃO" (catálogo cargo→setor, ~230 linhas, praticamente idêntico entre arquivos) e, em algumas, "Fechamento" (acompanhamento de admissão/experiência) e "Vagas Suspensas". O logo embutido nos arquivos confirma a marca: **+B Mais Barato** (vermelho + amarelo, ícone de cruz/+) e **+B Farma** (vermelho + branco).

O objetivo é substituir esse conjunto de planilhas por um sistema web único de controle de vagas (Recrutamento & Seleção), eliminando a digitação duplicada, automatizando os cálculos de prazo/SLA e dando à diretoria um painel sempre atualizado — sem exigir que as planilhas sejam a fonte da verdade.

## Decisões de arquitetura

- **Stack**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui. Um único projeto full-stack (UI + API routes), fácil de rodar localmente.
- **Banco de dados**: Supabase local via Docker (Postgres + Auth + Row Level Security), iniciado com `npx supabase start`. Rodando 100% local nesta máquina por enquanto (decisão confirmada com o usuário) — migração para Supabase Cloud + deploy (Vercel) fica para uma fase posterior, quando o modelo estiver validado.
- **Dados**: não vou importar automaticamente os dados reais de candidatos/vagas das planilhas (dados pessoais sensíveis) como parte da implementação. Em vez disso: (1) importo apenas o catálogo de **Cargos/Setores** (não é dado pessoal, é só uma lista de referência) a partir da aba "CARGOS PARA AUTOMATIZAÇÃO" real; (2) crio dados mock realistas (mesmas unidades, cargos e padrões de status) para desenvolver e demonstrar o sistema; (3) construo uma tela de **importação de planilha** para que a própria Lanna carregue os dados reais quando o sistema estiver pronto, unidade por unidade, sob o controle dela.
- **Tabelas/formulários**: TanStack Table (grids) + react-hook-form + zod.
- **Importação/Exportação**: biblioteca `xlsx` (SheetJS) para ler as planilhas no import e exportar relatórios em Excel (mantém compatibilidade para quem ainda precisa enviar algo em Excel).
- **Marca**: extraio os logos reais (`+B Mais Barato` e `+B Farma`) embutidos nas próprias planilhas e uso como assets oficiais da marca (`public/brand/`). Paleta: vermelho (~#E2131A) como cor primária, amarelo/dourado (~#FFC72C) como destaque, branco/cinza neutro — com o logo do supermercado como identidade principal, já que o pedido é para um supermercado.

## Modelo de dados (MVP)

- **unidades**: id, nome, codigo, ativo
- **setores**: id, nome
- **cargos**: id, nome, setor_id (catálogo único reaproveitado por todas as unidades — hoje duplicado em cada planilha)
- **usuarios/recrutadores**: via Supabase Auth + tabela `profiles` (nome, papel: `admin_diretoria` | `recrutador`, unidades que pode acessar)
- **vagas** (tabela central, substitui a aba "Mapa" + "Radar" de cada unidade):
  - numero (sequencial), numero_senior (opcional, nº do sistema Senior)
  - unidade_id, cargo_id, setor_id (preenchido automaticamente pelo cargo)
  - horario_trabalho, gestor_solicitante
  - motivo (`substituicao` | `aumento_de_quadro`)
  - justificativa (texto livre)
  - data_abertura, sla_dias, situacao (`em_aberto` | `fechado` | `cancelado`)
  - previsao_fechamento, dias_em_aberto, status_sla (`no_prazo` | `em_atraso`) — **calculados pelo sistema**, não digitados
  - candidato_aprovado, data_fechamento, data_admissao
  - recrutador_id, data_cancelamento, observacoes
  - suspensa (bool) — substitui a aba "Vagas Suspensas" como um filtro, não uma tabela separada
- **historico_status**: registro de auditoria de mudança de situação de cada vaga (não existe hoje nas planilhas — ganho real de rastreabilidade)
- Acompanhamento de experiência (1º/2º período, 45/90 dias) é **calculado** a partir de `data_admissao`, não precisa de tabela própria no MVP.

## Fases de implementação

**Fase 0 — Fundação**
- Scaffold Next.js + Tailwind + shadcn/ui; tokens de marca e logos (+B Mais Barato / +B Farma) extraídos das planilhas.
- Supabase local via Docker: schema/migrations das tabelas acima, RLS por unidade, Auth (login por e-mail/senha) com papéis `admin_diretoria`/`recrutador`.
- Seed: catálogo real de cargos/setores (~230 itens) + dados mock de vagas de exemplo nas 8 unidades.

**Fase 1 — MVP: Núcleo de Vagas**
- CRUD de Vagas por unidade (formulário replica os campos da planilha "Mapa").
- Grid com filtros (unidade, setor, situação, recrutador, período) e busca.
- Autocomplete de Cargo → preenche Setor automaticamente (catálogo único).
- Cálculo automático de dias em aberto, previsão de fechamento e status de SLA (fim do preenchimento manual de fórmulas).
- Cadastro de Unidades e de Cargos/Setores.

**Fase 2 — Painel da Diretoria**
- Dashboard consolidado entre unidades (substitui o "Mapa geral Unificado P Diretoria" montado à mão): vagas abertas por unidade/setor/motivo, % em atraso, tempo médio de fechamento.
- Visão Kanban por situação (substitui a aba "Radar de vagas", sem precisar digitar a vaga duas vezes).
- Exportação para Excel/PDF do que a diretoria quiser compartilhar fora do sistema.

**Fase 3 — Fechamento & Acompanhamento de Admissão**
- Ao marcar a vaga como fechada + data de admissão, o sistema calcula e mostra os prazos do 1º e 2º período de experiência (45/90 dias) com alertas de vencimento.
- Tela "Vagas Suspensas/Canceladas" com motivo e reativação.
- Histórico de alterações de cada vaga (auditoria).

**Fase 4 — Importação de dados reais e rollout**
- Tela de importação de planilha `.xlsx` (usa a estrutura de colunas real já identificada) com preview e validação antes de confirmar — para Lanna migrar o histórico de cada unidade quando quiser.
- Treinamento/uso paralelo por unidade até desligar as planilhas antigas.

**Fase 5 — Futuro (fora do MVP)**
- Portal do gestor solicitante (abrir vaga sem passar pelo RH diretamente).
- Integração com o sistema Senior (nº Senior já existe na planilha "Radar").
- Notificações por e-mail, deploy em nuvem (Supabase Cloud + Vercel) para acesso remoto pelas lojas.

## Verificação

- `npm run dev` local, validar fluxo: criar unidade → cadastrar cargo → abrir vaga → ver cálculo automático de prazo/SLA → fechar vaga com admissão → ver prazos de experiência calculados.
- Conferir painel da diretoria somando corretamente vagas de todas as unidades mock.
- Testar import de uma planilha real de exemplo (estrutura já mapeada) em ambiente de teste, sem gravar dados pessoais reais até a Lanna decidir migrar.

## Status atual (2026-11-23)

Implementado: Fase 0, Fase 1 e parte da Fase 2 (dashboard com KPIs e gráficos). Pendente: restante da Fase 2 (Kanban, exportação Excel/PDF), Fase 3, Fase 4, Fase 5.
