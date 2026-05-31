# Elite Dashboard

Dashboard premium para gestão de operação iGaming e afiliados.

## Rodar localmente

1. Instale Node.js 20 ou superior.
2. Execute `npm install`.
3. Execute `npm run dev`.
4. Abra `http://localhost:3000`.

## Conectar ao Supabase

1. Crie um projeto no Supabase.
2. Execute `supabase/schema.sql` no SQL Editor.
3. Copie `.env.example` para `.env.local` e preencha as credenciais.
4. Ative login por email e senha no Supabase Auth.

Sem credenciais válidas, a dashboard redireciona para `/login`.

## Cadastrar usuários manualmente

No painel do Supabase:

1. Abra `Authentication > Users`.
2. Clique em `Add user`.
3. Cadastre `admin@elite.com` como administrador.
4. Defina a senha manualmente no Supabase Auth. Não grave senhas neste repositório.
5. Quando tiver o e-mail do segundo usuário, repita o cadastro.
