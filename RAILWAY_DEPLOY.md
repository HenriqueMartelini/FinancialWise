# Guia de Deploy no Railway - FinWise

## Pré-requisitos

1. Conta no Railway (https://railway.app)
2. Repositório Git (GitHub, GitLab ou Bitbucket)
3. Código commitado e enviado para o repositório

## Passo a Passo

### 1. Preparar o Repositório

Certifique-se de que seu código está commitado e no repositório Git:

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push
```

### 2. Criar Projeto no Railway

1. Acesse https://railway.app e faça login
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo" (ou GitLab/Bitbucket)
4. Escolha o repositório do projeto
5. O Railway detectará automaticamente que é um projeto Node.js

### 3. Configurar Variáveis de Ambiente

No dashboard do Railway, vá em "Variables" e adicione as seguintes variáveis:

**Obrigatórias:**
- `DATABASE_URL` - URL de conexão do banco de dados MySQL
- `VITE_APP_ID` - ID da aplicação
- `JWT_SECRET` - Segredo para JWT (use uma string aleatória forte)
- `OAUTH_SERVER_URL` - URL do servidor OAuth
- `OWNER_OPEN_ID` - OpenID do proprietário

**Opcionais (para funcionalidades específicas):**
- `BUILT_IN_FORGE_API_URL` - URL da API Forge (para storage, maps, etc)
- `BUILT_IN_FORGE_API_KEY` - Chave da API Forge
- `VITE_OAUTH_PORTAL_URL` - URL do portal OAuth (para frontend)
- `VITE_FRONTEND_FORGE_API_KEY` - Chave da API Forge para frontend
- `VITE_FRONTEND_FORGE_API_URL` - URL da API Forge para frontend

**Importante:**
- Variáveis que começam com `VITE_` são expostas ao frontend
- `NODE_ENV` será automaticamente definido como `production` pelo Railway
- `PORT` é definido automaticamente pelo Railway

### 4. Configurar Banco de Dados (se necessário)

Se você precisa de um banco de dados MySQL:

1. No dashboard do Railway, clique em "New" → "Database" → "MySQL"
2. O Railway criará um banco de dados e uma variável `DATABASE_URL` automaticamente
3. Execute as migrações: Na seção de serviços, adicione um comando temporário:
   - Command: `pnpm db:push`
   - Ou conecte via SSH e execute: `pnpm db:push`

### 5. Deploy

O Railway fará o deploy automaticamente quando você:

1. Conectar o repositório
2. O Railway detectará o `package.json` e executará:
   - `pnpm install` (instala dependências)
   - `pnpm build` (constrói a aplicação)
   - `pnpm start` (inicia o servidor)

### 6. Configurar Domínio (IMPORTANTE - Para acesso fácil!)

O Railway fornece um domínio gratuito automático, mas você pode gerar um mais amigável:

1. No dashboard do serviço, vá em "Settings" → "Domains"
2. Clique em "Generate Domain" para obter um domínio gratuito
   - Exemplo: `finwise-production.up.railway.app`
   - Este domínio é GRATUITO e permanente
   - Você pode compartilhar com qualquer pessoa
3. Ou adicione um domínio customizado (ex: `finwise.com.br`)
   - Você precisa comprar o domínio em um registrador (ex: Registro.br, Namecheap)

**Dica:** O domínio `.up.railway.app` é perfeito para uso pessoal - é fácil de lembrar e compartilhar!

### 7. Verificar Logs

Para ver os logs e verificar se tudo está funcionando:

1. No dashboard do Railway, clique no serviço
2. Vá na aba "Deployments"
3. Clique no deployment mais recente para ver os logs

## Estrutura do Projeto

O Railway detectará automaticamente:
- **Build Command**: `pnpm build` (definido em `railway.json`)
- **Start Command**: `pnpm start` (definido em `railway.json` ou `Procfile`)
- **Output Directory**: `dist/public` (frontend estático)
- **Server File**: `dist/index.js` (servidor Express)

## Troubleshooting

### Erro: "Cannot find module"
- Verifique se todas as dependências estão no `package.json`
- Certifique-se de que o build foi executado corretamente

### Erro: "Port already in use"
- O Railway define automaticamente a variável `PORT`
- Não defina `PORT` manualmente nas variáveis de ambiente

### Erro: "Database connection failed"
- Verifique se `DATABASE_URL` está configurada corretamente
- Certifique-se de que o banco de dados está acessível

### Build falha
- Verifique os logs do build no dashboard do Railway
- Certifique-se de que todas as variáveis de ambiente necessárias estão configuradas

## Comandos Úteis

Para executar comandos no ambiente Railway:

1. No dashboard, clique no serviço
2. Vá em "Settings" → "Connect" para obter comandos SSH
3. Ou use o Railway CLI: `railway run <comando>`

Exemplo:
```bash
railway run pnpm db:push
```

## Notas

- O Railway usa `pnpm` automaticamente se detectar `pnpm-lock.yaml`
- O servidor Express serve tanto a API (`/api/trpc`) quanto o frontend estático
- Em produção, o servidor serve os arquivos de `dist/public`
- O modo de desenvolvimento (Vite HMR) não é usado em produção

