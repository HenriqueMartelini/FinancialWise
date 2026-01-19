# FinWise - Sistema de Gestão Financeira

Sistema completo de gestão financeira pessoal e familiar desenvolvido com React, TypeScript, tRPC e Express. Controle suas receitas, despesas, orçamentos, metas e dívidas em um só lugar.

## 🚀 Funcionalidades

- **Dashboard Financeiro**: Visão geral com receitas, despesas, saldo mensal e gráficos interativos
- **Transações**: Registro manual com categorização automática por IA
- **Orçamentos**: Planejamento mensal com limites por categoria e acompanhamento em tempo real
- **Metas Financeiras**: Quadro de metas com rastreamento de progresso
- **Dívidas**: Rastreador com status e controle de parcelas
- **Contas**: Gerenciamento de múltiplas contas bancárias e cartões
- **Importação**: Categorização automática de extratos bancários (OFX/CSV)
- **WhatsApp**: Registro de transações via texto e áudio usando IA
- **Insights**: Análises personalizadas sobre padrões de gastos e sugestões de economia
- **Família**: Sistema multi-usuário para compartilhamento de finanças
- **Personalização**: 8 temas de cores diferentes

## 🛠️ Tecnologias

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, tRPC
- **Banco de Dados**: MySQL com Drizzle ORM
- **Autenticação**: OAuth 2.0
- **IA**: Integração com LLM para insights e categorização

## 📋 Pré-requisitos

- Node.js 18+ 
- pnpm (gerenciador de pacotes)
- MySQL 8.0+ (ou banco compatível)

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/HenriqueMartelini/FinancialWise.git
cd FinancialWise
```

### 2. Instale as dependências

```bash
pnpm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com seus valores:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Obrigatórias
VITE_APP_ID=seu-app-id
JWT_SECRET=seu-secret-jwt-aleatorio
DATABASE_URL=mysql://usuario:senha@localhost:3306/finwise
OAUTH_SERVER_URL=https://seu-oauth-server.com
OWNER_OPEN_ID=seu-open-id

# Opcionais (para funcionalidades específicas)
BUILT_IN_FORGE_API_URL=https://forge.butterfly-effect.dev
BUILT_IN_FORGE_API_KEY=sua-chave-forge
VITE_OAUTH_PORTAL_URL=https://seu-oauth-portal.com
VITE_FRONTEND_FORGE_API_KEY=sua-chave-frontend
VITE_FRONTEND_FORGE_API_URL=https://forge.butterfly-effect.dev
```

**Nota:** Para testes básicos, você pode usar valores placeholder. Algumas funcionalidades podem não funcionar sem as APIs configuradas.

### 4. Configure o banco de dados

Certifique-se de que o MySQL está rodando e execute as migrações:

```bash
pnpm db:push
```

## 🏃 Executando

### Modo de Desenvolvimento

```bash
pnpm dev
```

A aplicação estará disponível em `http://localhost:3000`

### Modo de Produção

```bash
pnpm build
pnpm start
```

## 📁 Estrutura do Projeto

```
├── client/          # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/       # Páginas da aplicação
│   │   └── lib/         # Utilitários e configurações
├── server/         # Backend Express
│   ├── _core/      # Módulos core do servidor
│   └── routers.ts  # Rotas tRPC
├── shared/         # Código compartilhado
└── drizzle/        # Migrações do banco de dados
```

## 🧪 Testes

```bash
pnpm test
```

## 📦 Scripts Disponíveis

- `pnpm dev` - Inicia o servidor em modo desenvolvimento
- `pnpm build` - Compila para produção
- `pnpm start` - Inicia o servidor em modo produção
- `pnpm test` - Executa os testes
- `pnpm check` - Verifica tipos TypeScript
- `pnpm format` - Formata o código
- `pnpm db:push` - Executa migrações do banco de dados

## 🌐 Deploy

### Railway

O projeto está configurado para deploy no Railway. Veja `RAILWAY_DEPLOY.md` para instruções detalhadas.

1. Conecte seu repositório no Railway
2. Configure as variáveis de ambiente
3. O Railway fará o deploy automaticamente

## 📝 Licença

MIT

## 👤 Autor

Henrique Martelini

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.
