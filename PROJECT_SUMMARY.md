# PROJECT SUMMARY

## Visão Geral

### Nome do projeto

Elite Dashboard / `orbit-affiliates-dashboard`.

O nome visual exibido na interface é **ELITE DASHBOARD**. O nome técnico definido em `package.json` é `orbit-affiliates-dashboard`.

### Objetivo do sistema

O projeto é uma plataforma operacional para gestão de uma operação de iGaming, afiliados, campanhas pagas, criativos, páginas de operação, inteligência competitiva/SPY, finanças, relatórios, workspace e integrações.

O sistema centraliza dados que hoje ficariam espalhados em planilhas, Google Drive, Google Docs, Meta Ads, APIs de afiliados/casas de aposta e tarefas operacionais. A proposta é permitir que um operador acompanhe a performance da operação e organize experimentos de mídia, criativos, páginas e ofertas.

### Público-alvo

- Operadores de tráfego pago em iGaming.
- Afiliados e gestores de campanhas.
- Times pequenos de performance que precisam organizar campanhas, criativos, páginas, ofertas, métricas e tarefas.
- Administradores da operação que precisam consultar orçamento, ROI, FTDs, registros, SPY e status de integrações.

### Fluxo principal da plataforma

1. O usuário acessa a aplicação.
2. O middleware verifica sessão Supabase.
3. Sem sessão válida, o usuário é redirecionado para `/login`.
4. No login, o usuário entra com e-mail e senha via Supabase Auth.
5. Com sessão válida, o usuário abre o dashboard principal em `/`.
6. A navegação lateral permite alternar entre:
   - Visão Geral
   - Financeiro
   - Campanhas
   - Criativos
   - SPY
   - Páginas
   - Workspace
   - Relatórios
   - Integrações
7. Cada módulo lê e grava dados por meio de `lib/repository.ts`.
8. Se Supabase estiver configurado, os dados são persistidos no banco com RLS por usuário.
9. Se Supabase não estiver configurado em contexto client-side, algumas operações usam fallback local em `localStorage`.

## Tecnologias

### Frontend

- Next.js 15.1.6 com App Router.
- React 19.
- TypeScript.
- Tailwind CSS 3.4.
- CSS global em `app/globals.css`.
- Componentes client-side em `app/page.tsx`, `app/login/page.tsx` e `components/date-range-filter.tsx`.

### Backend

- Rotas API do Next.js em `app/api/**/route.ts`.
- Supabase Auth e Supabase Database.
- Funções server-side para:
  - bootstrap de administrador;
  - importação de SPY via Google Docs;
  - listagem de criativos via Google Drive;
  - preparação de importação de influenciadores via Apify;
  - teste, criptografia e sincronização read-only de Meta Ads.

### Banco de dados

- Supabase/PostgreSQL.
- Schema principal em `supabase/schema.sql`.
- Row Level Security habilitado nas tabelas operacionais.
- Políticas `own_data` por usuário.
- Trigger `on_auth_user_created` para criar perfil e seeds iniciais.

### Deploy

- Repositório Git remoto: `https://github.com/raphaias122-png/elitedashboard.git`.
- Branch atual e principal: `main`.
- O projeto é compatível com deploy em Vercel por ser Next.js.
- Variáveis de ambiente necessárias ficam documentadas em `.env.example`.
- Não há arquivo de configuração Vercel dedicado no repositório.

### Bibliotecas importantes

- `@supabase/ssr`: cliente Supabase para SSR/middleware e browser.
- `@supabase/supabase-js`: cliente Supabase server-side.
- `lucide-react`: ícones da interface.
- `recharts`: gráficos da visão geral e relatórios.
- `clsx`, `class-variance-authority`, `tailwind-merge`: utilitários de classe/estilo.
- `next`, `react`, `react-dom`: base da aplicação.
- APIs nativas usadas no servidor:
  - `node:crypto` para criptografia AES-256-GCM de tokens.
  - `fetch` para Google Docs, Google Drive e Meta Graph API.

## Arquitetura

### Estrutura geral do projeto

```text
.
├── app/
│   ├── api/
│   │   ├── bootstrap-admin/
│   │   ├── import-creatives/
│   │   ├── import-influencers/
│   │   ├── import-spy/
│   │   └── meta-ads/
│   ├── globals.css
│   ├── layout.tsx
│   ├── login/page.tsx
│   └── page.tsx
├── components/
│   └── date-range-filter.tsx
├── lib/
│   ├── google-imports.ts
│   ├── meta-read-only.ts
│   ├── repository.ts
│   ├── supabase.ts
│   └── utils.ts
├── public/
│   ├── elite-dashboard-logo.png
│   └── operation-pages/
├── supabase/
│   ├── schema.sql
│   └── seed_creative_assets_examples.sql
├── middleware.ts
├── package.json
└── README.md
```

### Organização de páginas

- `app/layout.tsx`: layout raiz HTML e importação do CSS global.
- `app/login/page.tsx`: tela de autenticação.
- `app/page.tsx`: aplicação principal inteira, com navegação, módulos, formulários, tabelas, cards e gráficos.

Observação importante: atualmente a maior parte da interface está concentrada em um único arquivo grande, `app/page.tsx`. Futuras refatorações podem separar cada módulo em componentes próprios, mas isso ainda não foi feito.

### Organização de componentes

- `components/date-range-filter.tsx`: componente reutilizável para filtro global de período, com presets como Hoje, Ontem, Últimos 7 dias, Semana atual, Mês atual, Últimos 30 dias e Personalizado.
- Componentes internos em `app/page.tsx`:
  - `Badge`
  - `Btn`
  - `Card`
  - `Overview`
  - `CampaignTable`
  - `Creatives`
  - `Spy`
  - `Financeiro`
  - `Campanhas`
  - `Relatorios`
  - `Paginas`
  - `Workspace`
  - `Integracoes`

### Organização de serviços

- `lib/supabase.ts`: cria cliente Supabase browser se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estiverem disponíveis.
- `lib/repository.ts`: camada de acesso aos dados usada pelos módulos client-side. Centraliza `listRows`, `createRow`, `updateRow`, `deleteRow`, settings locais e backup.
- `lib/google-imports.ts`: funções para ler Google Docs público, parsear documento SPY e listar arquivos de pasta Google Drive via API key.
- `lib/meta-read-only.ts`: valida token Meta Ads read-only, criptografa/descriptografa token, mascara token e consulta insights da Meta Graph API.
- `middleware.ts`: protege rotas da aplicação com Supabase SSR, exceto `/login`, `/api`, assets e arquivos estáticos.

## Módulos Existentes

### Login

Objetivo: controlar acesso ao dashboard.

O que faz:
- Exibe formulário de e-mail e senha.
- Usa Supabase Auth com `signInWithPassword`.
- Redireciona para `/` quando já existe sessão.
- Mostra mensagem se Supabase não estiver configurado ou credenciais falharem.

Status atual: funcional, dependente de Supabase Auth configurado.

### Visão Geral

Objetivo: mostrar resumo executivo da operação.

O que faz:
- Carrega orçamento, registros financeiros, métricas diárias e campanhas.
- Calcula métricas como receita, gasto, lucro, ROI, FTDs, leads e registros.
- Exibe cards, gráfico e tabela de campanhas.
- Permite exportar relatório CSV básico de campanhas.
- Usa meta local de FTD salva em `localStorage`.

Status atual: funcional com dados vindos do Supabase ou fallback local, conforme configuração.

### Financeiro

Objetivo: registrar e acompanhar resultado financeiro da operação.

O que faz:
- Cria, edita e remove registros financeiros.
- Campos usados incluem data, total de anúncios, aberturas de link, registros, FTD, depósitos, saques, receita bruta, custo de ferramentas, comissão total e observações.
- Calcula resumo financeiro na interface, incluindo lucro líquido, ROI, custo por FTD e saldo de depósitos.
- Persiste em `financial_records`.

Status atual: funcional para CRUD básico e cálculo operacional.

### Campanhas

Objetivo: organizar campanhas de mídia e relacioná-las com criativos, páginas e ofertas.

O que faz:
- Lista campanhas.
- Cria, edita e remove campanhas.
- Campos principais: nome, plataforma, país, tipo, objetivo, orçamento diário, orçamento total, valor gasto, status, criativos, página, oferta, pixel e notas.
- Usa dados auxiliares de `creatives`, `operation_pages`, `offers` e `daily_metrics`.
- Exibe tabela consolidada de campanhas e métricas.

Status atual: funcional como controle manual de campanhas. Integração automática real ainda é parcial/preparada.

### Criativos

Objetivo: centralizar assets criativos e materiais vindos do Drive.

O que faz:
- Lista registros de criativos/assets.
- Trabalha com tabelas como `creatives`, `drive_creatives`, `creative_folders` e `creative_assets`.
- Possui rota `/api/import-creatives` para listar arquivos de pastas Google Drive configuradas.
- As pastas iniciais são criadas no trigger de novo usuário.

Status atual: leitura/organização funcional; importação do Google Drive depende de `GOOGLE_DRIVE_API_KEY`. Não há edição avançada de assets dentro do dashboard.

### SPY

Objetivo: organizar inteligência competitiva, marcas, anúncios, funis, páginas, padrões criativos e ideias de adaptação.

O que faz:
- Lista itens SPY de `spy_items`.
- Lista fontes SPY de `spy_sources`.
- Permite busca por nome, plataforma, nicho, descrição ou ângulo.
- Permite adicionar manualmente novo anúncio ao radar.
- Permite remover item SPY.
- Possui rota `/api/import-spy` para ler documento público do Google Docs e transformar linhas em itens estruturados.
- Possui função `claim_existing_spy_and_creative_data` para administrador vincular dados existentes ao usuário atual.

Status atual: funcional para radar manual e importação preparada via Google Docs público.

### Páginas

Objetivo: catalogar páginas/landings da operação.

O que faz:
- Cria, edita e remove registros de páginas.
- Campos básicos usados na interface: nome, preview URL e download URL.
- Persiste em `operation_pages`.
- O diretório `public/operation-pages` contém pacotes reais de landings e arquivos zip.

Status atual: funcional como catálogo manual. Há landings estáticas versionadas em `public`.

### Workspace

Objetivo: organizar tarefas operacionais em kanban simples.

O que faz:
- Lista cards por status.
- Cria, edita e remove cards.
- Permite mudar status via select.
- Campos usados: título, descrição, prioridade e status.
- Status atuais na interface incluem colunas como Ideias, Em andamento, Revisão, Feito e Bloqueado.
- Persiste em `workspace_cards`.

Status atual: funcional para kanban simples. As tabelas de boards, colunas, checklists, notas e metas já existem, mas a interface atual usa principalmente cards.

### Relatórios

Objetivo: oferecer leitura consolidada e exportação de dados.

O que faz:
- Usa dados de métricas, campanhas e financeiros.
- Possui função de backup em `exportRepositoryBackup`, agrupando dados por financeiro, campanhas, criativos, SPY, páginas, workspace, integrações e relatórios/metas.
- A exportação CSV principal está ligada ao botão da visão geral.

Status atual: funcional de forma básica. Relatórios avançados e automações completas ainda parecem planejados.

### Integrações

Objetivo: configurar conexões externas.

O que faz:
- Interface para Meta Ads API e API de casa de aposta/afiliado.
- Salva nome, token, Business Manager ID, Ad Account ID, Pixel ID, URL de API, affiliate ID, subid e status.
- Mascara tokens na interface.
- Registra status e última sincronização simulada.
- Mostra mapeamentos futuros de campos.
- Rotas Meta Ads permitem testar token read-only, criptografar token e buscar insights.

Status atual: parcialmente funcional. Configuração e armazenamento existem; teste e sync Meta Ads existem via API, mas a interface atual descreve sincronização como simulada e não faz ingestão completa automática no banco.

### Bootstrap Admin

Objetivo: criar usuário administrador inicial de forma controlada.

O que faz:
- Rota `POST /api/bootstrap-admin`.
- Exige header `x-bootstrap-secret`.
- Usa `SUPABASE_SERVICE_ROLE_KEY`.
- Cria usuário Supabase confirmado com metadata de admin.
- Faz upsert em `public.users`.

Status atual: funcional se variáveis seguras estiverem configuradas.

### Importação de Influenciadores

Objetivo: preparar integração futura para coleta de perfis públicos.

O que faz:
- Rota `POST /api/import-influencers`.
- Exige `APIFY_API_TOKEN`.
- Recebe lista de handles.
- Retorna mensagem informando que a integração está preparada para Actor Apify escolhido.

Status atual: placeholder operacional/preparado; não coleta dados reais ainda.

### Operation Pages Estáticas

Objetivo: armazenar páginas de operação/landing pages prontas para uso ou download.

O que faz:
- `public/operation-pages/pinup-roulette-landing-ready` contém landing com roleta, assets, scripts, CSS, README de deploy e servidor Node.
- `public/operation-pages/ad-cl-bet7k-pinup` contém outra landing clonada/organizada, assets e manifest.
- Há arquivos zip prontos no mesmo diretório.

Status atual: assets presentes no repositório. A landing Pin-Up tem instruções próprias para rodar com Node quando for necessário proteger endpoint de Conversions API.

## Banco de Dados

### Tabelas principais e finalidade

- `users`: perfil do usuário autenticado, nome, papel, avatar e flag de troca de senha.
- `campaigns`: campanhas de mídia, plataforma, país, nicho, status, orçamento, links, pixel e campos adicionais de operação.
- `creatives`: criativos manuais com asset, nicho, país, ângulo, hook, CTA, métricas e notas.
- `spy_ads`: anúncios observados com texto, headline, CTA, oferta, ângulo, score e notas.
- `spy_items`: itens SPY mais genéricos, incluindo categorias, URLs, descrições, prioridade, tags e fonte documental.
- `spy_sources`: fontes de SPY, como Google Docs.
- `daily_metrics`: métricas diárias por campanha, incluindo impressões, cliques, spend, leads, registros, FTDs e receita.
- `financial_records`: registros financeiros por data com gastos, receita, depósitos, saques, comissões e métricas geradas.
- `dds_logs`: logs diários da operação, dono, tópicos, problemas e próximos passos.
- `drive_creatives`: arquivos de criativos importados do Google Drive.
- `creative_folders`: pastas do Drive configuradas para criativos prontos e para modelar.
- `creative_assets`: assets importados do Drive, com categoria, país, nicho, status e origem.
- `operation_pages`: páginas/landings da operação com URLs de arquivo, preview e download.
- `influencers`: base de influenciadores, métricas, contato, proposta, status e histórico.
- `influencer_contacts`: histórico de contatos com influenciadores.
- `operation_budgets`: orçamento disponível da operação.
- `integrations`: configurações de integrações externas.
- `integration_sync_logs`: logs de sincronização de integrações.
- `meta_ads_metrics`: métricas vindas da Meta Ads API em nível de campanha/adset/ad.
- `workspace_boards`: quadros do workspace.
- `workspace_columns`: colunas do workspace.
- `workspace_cards`: cards/tarefas do workspace.
- `workspace_checklists`: checklists de cards.
- `workspace_notes`: notas do workspace.
- `workspace_goals`: metas do workspace.
- `offers`: ofertas/casas/operadores com comissão, link de afiliado e receita gerada.
- `campaign_creatives`: relação N:N entre campanhas e criativos.
- `campaign_pages`: relação N:N entre campanhas e páginas.
- `campaign_offers`: relação N:N entre campanhas e ofertas.
- `campaign_budgets`: orçamento e metas por campanha.
- `campaign_tests`: testes de campanha combinando campanha, criativo, página e oferta.

### Relacionamentos importantes

- Quase todas as tabelas operacionais têm `user_id` referenciando `auth.users(id)`.
- `users.id` referencia `auth.users(id)` e representa o perfil público do usuário.
- `daily_metrics.campaign_id` referencia `campaigns.id`.
- `financial_records.campaign_id` referencia `campaigns.id`.
- `influencer_contacts.influencer_id` referencia `influencers.id`.
- `integration_sync_logs.integration_id` referencia `integrations.id`.
- `meta_ads_metrics.integration_id` referencia `integrations.id`.
- `workspace_columns.board_id` referencia `workspace_boards.id`.
- `workspace_cards.board_id` referencia `workspace_boards.id`.
- `workspace_cards.column_id` referencia `workspace_columns.id`.
- `workspace_checklists.card_id` referencia `workspace_cards.id`.
- `workspace_notes.board_id` referencia `workspace_boards.id`.
- `workspace_goals.board_id` referencia `workspace_boards.id`.
- `campaign_creatives` liga `campaigns` a `creatives`.
- `campaign_pages` liga `campaigns` a `operation_pages`.
- `campaign_offers` liga `campaigns` a `offers`.
- `campaign_budgets.campaign_id` referencia `campaigns.id`.
- `campaign_tests` referencia campanhas e opcionalmente criativos, páginas e ofertas.
- `creative_assets.folder_id` referencia `creative_folders.id`.

### RLS e segurança

- Row Level Security é habilitado para as tabelas principais.
- A política `own_data` permite acesso apenas quando `auth.uid()` corresponde ao `user_id`.
- Para `users`, a política compara `auth.uid()` com `id`.
- A função `claim_existing_spy_and_creative_data` só deve ser executada por usuário admin.
- O bootstrap admin exige secret e service role key.

### Campos gerados

- `daily_metrics` gera `ctr`, `cpc`, `cpm`, `cpa`, `profit` e `roi`.
- `financial_records` gera `profit` e `roi` pelos campos originais `revenue` e `spend`.

Observação: a interface financeira atual usa campos expandidos como `ads_total`, `opened_link`, `registrations`, `ftd`, `deposits`, `withdrawals`, `gross_revenue`, `tools_cost` e `total_commission`, adicionados por `alter table`.

## Integrações

### Supabase

Uso atual:
- Autenticação por e-mail e senha.
- Middleware SSR para proteger rotas.
- Banco PostgreSQL com RLS.
- CRUD client-side via `lib/repository.ts`.
- Criação de administrador via rota server-side com service role.

Variáveis principais:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_BOOTSTRAP_SECRET`
- `INITIAL_ADMIN_EMAIL`
- `INITIAL_ADMIN_PASSWORD`

### Google Drive

Uso atual:
- `lib/google-imports.ts` lista arquivos de pastas do Drive pela API v3.
- `/api/import-creatives` usa duas pastas fixas:
  - Drive - Criativos Prontos
  - Drive - Criativos Para Modelar
- Requer `GOOGLE_DRIVE_API_KEY`.
- Retorna arquivos com id, nome, MIME type, links, thumbnail, status, nicho e país.

Status: funcional se a API key e permissões públicas/adequadas das pastas estiverem corretas.

### Google Docs

Uso atual:
- `/api/import-spy` exporta o documento público como texto.
- `parseSpyDocument` transforma linhas com padrão `Nome - descrição` em itens SPY.
- O documento atual configurado no código é:
  - `1rWTk54TMAvXxBmtcX19LYx_Vcoe-FP2voB_Y9Riisns`

Status: funcional para documento público exportável.

### Meta Ads

Uso atual:
- `lib/meta-read-only.ts` trabalha com Meta Graph API.
- Escopos permitidos: `ads_read` e `read_insights`.
- Escopos proibidos: `ads_management` e `business_management`.
- `/api/meta-ads/test` valida token read-only.
- `/api/meta-ads/encrypt-token` criptografa token com AES-256-GCM.
- `/api/meta-ads/sync` busca insights em nível de anúncio.

Variáveis:
- `INTEGRATION_ENCRYPTION_KEY`
- `META_GRAPH_API_VERSION`

Status: funções server-side existem. A UI de integrações ainda registra sincronização simulada e não persiste automaticamente os insights no banco.

### API de Afiliado / Casa de Aposta

Uso atual:
- Interface em Integrações permite salvar URL da API, token, affiliate ID e subid.
- Mapeamento futuro exibido: date, registrations, ftd, deposits, withdrawals, gross_revenue, commission_total, subid, campaign_id.

Status: preparada, sem chamada real implementada.

### Apify

Uso atual:
- `/api/import-influencers` verifica `APIFY_API_TOKEN`.
- Retorna mensagem indicando preparação para Actor escolhido.

Status: placeholder/preparado.

## Fluxo Operacional

1. Administrador prepara Supabase executando `supabase/schema.sql`.
2. Administrador configura variáveis de ambiente.
3. Usuário é criado manualmente no Supabase Auth ou via bootstrap admin.
4. Usuário acessa `/login`.
5. Após autenticar, abre a tela principal.
6. Na Visão Geral, acompanha orçamento, receita, gasto, lucro, ROI, FTDs, leads e registros.
7. Em Financeiro, lança resultados diários da operação.
8. Em Campanhas, cadastra campanhas e relaciona criativos, páginas, ofertas e pixels.
9. Em Criativos, acompanha materiais criativos e assets importáveis do Google Drive.
10. Em SPY, consulta oportunidades, fontes, marcas, anúncios e ideias de adaptação.
11. Em Páginas, cataloga landing pages e links de preview/download.
12. Em Workspace, organiza tarefas por status e prioridade.
13. Em Relatórios, consulta/exporta dados consolidados.
14. Em Integrações, prepara credenciais de Meta Ads e API de afiliado/casa de aposta.
15. Administrador pode usar o botão de vincular dados para associar dados SPY/criativos existentes ao usuário atual, desde que seja admin.

## Deploy

### GitHub

- Remote `origin`: `https://github.com/raphaias122-png/elitedashboard.git`.
- Branch atual: `main`.
- A branch local está configurada para acompanhar `origin/main`.

### Branch principal

- `main`.

### Processo de deploy

Processo esperado para aplicação principal:

1. Instalar dependências com `npm install`.
2. Configurar variáveis de ambiente.
3. Executar schema no Supabase.
4. Rodar localmente com `npm run dev`.
5. Gerar build com `npm run build`.
6. Publicar em Vercel ou outro host compatível com Next.js.

### Vercel

O projeto não contém `vercel.json`. Em Vercel, a configuração deve usar o detector padrão de Next.js.

Variáveis necessárias no ambiente Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_DRIVE_API_KEY`
- `APIFY_API_TOKEN`
- `INTEGRATION_ENCRYPTION_KEY`
- `META_GRAPH_API_VERSION`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_BOOTSTRAP_SECRET`
- `INITIAL_ADMIN_EMAIL`
- `INITIAL_ADMIN_PASSWORD`

### Deploy das landings em `public/operation-pages`

As landings estáticas podem ser servidas como assets públicos dentro do Next.js. A landing `pinup-roulette-landing-ready` também possui um servidor Node próprio e README de deploy, especialmente para proteger Meta Conversions API.

## Funcionalidades Concluídas

- Autenticação com Supabase Auth.
- Middleware protegendo rotas privadas.
- Tela de login.
- Layout principal com menu lateral responsivo.
- Navegação entre módulos sem mudança de rota.
- Visão Geral com métricas consolidadas.
- Cards de KPIs.
- Gráficos com Recharts.
- Exportação CSV básica de campanhas.
- Filtro global de período com persistência local.
- CRUD financeiro.
- Cálculos financeiros operacionais.
- CRUD de campanhas.
- Associação visual/manual de campanhas com criativos, páginas, ofertas e pixels.
- Listagem e organização de criativos/assets.
- Importação preparada de criativos via Google Drive.
- SPY com listagem, busca, criação manual e remoção.
- Importação de SPY via Google Docs público.
- Catálogo de páginas/landings.
- Workspace kanban simples.
- CRUD de cards do workspace.
- Relatórios básicos e backup estruturado via repository.
- Tela de integrações.
- Cadastro de integração Meta Ads.
- Cadastro de integração API afiliado/casa de aposta.
- Máscara de tokens.
- Criptografia server-side de token Meta Ads.
- Validação read-only de token Meta Ads.
- Busca de insights Meta Ads via Graph API.
- Bootstrap seguro de usuário admin.
- Schema Supabase com RLS.
- Trigger de criação de perfil e seeds iniciais por usuário.
- Função admin para vincular dados SPY/criativos existentes.
- Assets e landings de operação versionados em `public/operation-pages`.

## Funcionalidades Planejadas ou Identificadas para Futuro

- Separar `app/page.tsx` em módulos/componentes menores.
- Persistir automaticamente os resultados de `/api/meta-ads/sync` em `meta_ads_metrics`, `daily_metrics` ou tabelas correlatas.
- Implementar sincronização real da API de afiliado/casa de aposta.
- Implementar coleta real de influenciadores via Apify Actor.
- Melhorar módulo de Relatórios com filtros, exportações e dashboards por campanha, país, oferta e criativo.
- Expandir Workspace para usar boards, colunas, checklists, notas, metas e anexos de forma completa.
- Criar telas dedicadas para Ofertas, Influenciadores, DDS e Orçamentos, já que as tabelas existem.
- Implementar fluxo completo de importação/salvamento dos criativos do Google Drive no banco.
- Criar tratamento de erro e loading padronizado por módulo.
- Criar testes automatizados.
- Criar documentação de deploy Vercel passo a passo.
- Corrigir textos com encoding quebrado exibidos em alguns arquivos, se isso também aparecer na interface.
- Melhorar política de criptografia/armazenamento de tokens em produção.
- Criar auditoria para rotas sensíveis.
- Adicionar logs reais de sincronização em `integration_sync_logs`.
- Usar relações N:N de campanhas de forma mais completa na interface.
- Criar fluxo de publicação/download das páginas de operação.

## Estatísticas do Projeto

Valores aproximados calculados a partir dos arquivos rastreados pelo Git no momento desta documentação:

- Quantidade aproximada de arquivos rastreados: 135.
- Quantidade aproximada de arquivos em `public/operation-pages`: 104.
- Quantidade aproximada de páginas Next.js: 2 (`/` e `/login`).
- Quantidade aproximada de rotas API: 7.
- Quantidade aproximada de componentes/funções React declaradas em `app` e `components`: 17.
- Quantidade aproximada de linhas em arquivos de código/documentação rastreados com extensões relevantes: 6.768.
- Arquivo principal de UI: `app/page.tsx`, com mais de 2.000 linhas.
- Tabelas Supabase principais: 31.

Observação: `node_modules`, `.next`, logs locais e arquivos não rastreados não entram nessas estatísticas.

## Guia para Futuras IAs

### Como entender o projeto rapidamente

1. Leia primeiro este arquivo.
2. Depois leia `README.md` para instruções mínimas de execução.
3. Leia `package.json` para versões e scripts.
4. Leia `supabase/schema.sql` para entender o modelo de dados.
5. Leia `lib/repository.ts` para entender como a UI acessa dados.
6. Leia `app/page.tsx` para entender todos os módulos visuais.
7. Leia `app/api/**/route.ts` apenas quando precisar mexer em integrações.

### Onde estão os módulos principais

- Login: `app/login/page.tsx`.
- Dashboard e módulos principais: `app/page.tsx`.
- Filtro de período: `components/date-range-filter.tsx`.
- Acesso a dados: `lib/repository.ts`.
- Cliente Supabase browser: `lib/supabase.ts`.
- Google Docs/Drive: `lib/google-imports.ts`.
- Meta Ads read-only: `lib/meta-read-only.ts`.
- Segurança de rotas: `middleware.ts`.
- Banco: `supabase/schema.sql`.
- Landings e assets públicos: `public/operation-pages`.

### O que não deve ser alterado sem cuidado

- `supabase/schema.sql`: qualquer mudança pode afetar produção, RLS, relações e dados existentes.
- `middleware.ts`: alterações podem bloquear login ou expor páginas privadas.
- `lib/repository.ts`: é o ponto comum de CRUD usado por muitos módulos.
- `app/page.tsx`: concentra a interface inteira; mudanças pequenas podem afetar vários módulos.
- `lib/meta-read-only.ts`: lida com tokens, permissões e Graph API.
- `app/api/bootstrap-admin/route.ts`: usa service role e cria admin.
- Variáveis de ambiente e secrets: nunca commitar valores reais.
- `public/operation-pages`: contém assets e landings prontas; mudanças podem quebrar páginas públicas ou zips existentes.

### Recomendações para continuar o desenvolvimento

- Antes de alterar funcionalidades, rode `git status` e identifique mudanças existentes.
- Prefira mudanças pequenas e isoladas.
- Mantenha compatibilidade com Supabase e com fallback local quando o módulo já usa `repository.ts`.
- Ao criar novo módulo, confira se já existe tabela correspondente no schema.
- Ao mexer em integrações, documente claramente se a chamada é real ou simulada.
- Ao mexer em tokens, preserve a lógica read-only e a criptografia.
- Ao refatorar `app/page.tsx`, extraia um módulo por vez e valide visualmente.
- Não altere o banco, layout ou funcionalidades em tarefas apenas documentais.

