# 🚀 Deploy Rápido no Railway (GRATUITO)

## Passo a Passo Simples

### 1. Acesse o Railway
- Vá em: **https://railway.app**
- Faça login com sua conta **GitHub**

### 2. Criar Novo Projeto
1. Clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Escolha o repositório: **HenriqueMartelini/FinancialWise**
4. O Railway vai detectar automaticamente e começar o deploy!

### 3. Configurar Variáveis de Ambiente

No dashboard do projeto, vá em **"Variables"** e adicione:

#### Mínimas para funcionar:
```
VITE_APP_ID=test-app
JWT_SECRET=qualquer-string-aleatoria-segura-aqui
DATABASE_URL=mysql://usuario:senha@host:porta/banco
OAUTH_SERVER_URL=https://seu-oauth.com
OWNER_OPEN_ID=seu-open-id
```

#### Opcionais (para funcionalidades extras):
```
BUILT_IN_FORGE_API_URL=https://forge.butterfly-effect.dev
BUILT_IN_FORGE_API_KEY=sua-chave
VITE_OAUTH_PORTAL_URL=https://seu-portal.com
```

### 4. Adicionar Banco de Dados MySQL (Opcional)

1. No dashboard, clique em **"New"** → **"Database"** → **"MySQL"**
2. O Railway cria automaticamente e adiciona a variável `DATABASE_URL`
3. Execute as migrações (no terminal do Railway ou via CLI):
   ```bash
   railway run pnpm db:push
   ```

### 5. Obter seu Domínio

1. No dashboard do serviço, vá em **"Settings"** → **"Domains"**
2. Clique em **"Generate Domain"**
3. Você terá uma URL tipo: `finwise-production.up.railway.app`
4. **GRATUITO e permanente!**

## ✅ Pronto!

Sua aplicação estará online e acessível de qualquer lugar!

## 💡 Dicas

- O Railway tem plano gratuito generoso
- O deploy é automático a cada push no GitHub
- Você pode ver logs em tempo real no dashboard
- HTTPS é automático e gratuito

## 🔧 Troubleshooting

**Deploy falha?**
- Verifique os logs no dashboard
- Confirme que todas as variáveis obrigatórias estão configuradas

**Banco de dados não conecta?**
- Verifique se o MySQL foi criado no Railway
- Confirme que `DATABASE_URL` está correta

**Aplicação não abre?**
- Aguarde alguns minutos após o deploy
- Verifique se o domínio foi gerado corretamente
