# 🚀 Deploy no AWS (GRATUITO - Tier Free)

AWS oferece tier gratuito por 12 meses e algumas opções permanentes gratuitas. Para esta aplicação Express, vamos usar **AWS Elastic Beanstalk**.

## 📋 Pré-requisitos

1. Conta AWS (crie em https://aws.amazon.com - tem tier gratuito)
2. AWS CLI instalado
3. EB CLI (Elastic Beanstalk CLI) instalado

## 🔧 Instalação das Ferramentas

### 1. Instalar AWS CLI

**macOS:**
```bash
brew install awscli
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Windows:**
Baixe de: https://aws.amazon.com/cli/

### 2. Instalar EB CLI

```bash
pip install awsebcli
```

### 3. Configurar AWS CLI

```bash
aws configure
```

Você precisará de:
- AWS Access Key ID
- AWS Secret Access Key
- Região (ex: `us-east-1`)
- Formato de saída (ex: `json`)

**Como obter as credenciais:**
1. Acesse https://console.aws.amazon.com
2. Vá em IAM → Users → Seu usuário → Security credentials
3. Crie Access Key

## 🚀 Deploy

### Opção 1: Via EB CLI (Recomendado)

1. **Inicializar Elastic Beanstalk:**
```bash
eb init
```

Escolha:
- Região (ex: us-east-1)
- Aplicação: FinWise
- Platform: Node.js
- Versão: Node.js 20.x (ou mais recente)
- SSH: Sim (opcional)

2. **Criar ambiente:**
```bash
eb create finwise-env
```

3. **Configurar variáveis de ambiente:**
```bash
eb setenv VITE_APP_ID=seu-app-id \
  JWT_SECRET=seu-secret \
  DATABASE_URL=mysql://usuario:senha@host:porta/banco \
  OAUTH_SERVER_URL=https://seu-oauth.com \
  OWNER_OPEN_ID=seu-open-id
```

4. **Fazer deploy:**
```bash
eb deploy
```

5. **Abrir aplicação:**
```bash
eb open
```

### Opção 2: Via Console AWS (Mais Simples)

1. **Acesse AWS Console:**
   - Vá em: https://console.aws.amazon.com/elasticbeanstalk

2. **Criar Nova Aplicação:**
   - Clique em "Create Application"
   - Nome: `FinWise`
   - Descrição: `Sistema de Gestão Financeira`

3. **Criar Ambiente:**
   - Clique em "Create environment"
   - Escolha "Web server environment"
   - Platform: Node.js
   - Platform branch: Node.js 20 running on 64bit Amazon Linux
   - Application code: Upload your code
   - Faça upload do código (zip do projeto)

4. **Configurar Variáveis de Ambiente:**
   - Vá em Configuration → Software → Environment properties
   - Adicione as variáveis:
     ```
     VITE_APP_ID=seu-app-id
     JWT_SECRET=seu-secret
     DATABASE_URL=mysql://...
     OAUTH_SERVER_URL=https://...
     OWNER_OPEN_ID=seu-open-id
     ```

5. **Deploy:**
   - Clique em "Create environment"
   - Aguarde o deploy (5-10 minutos)

## 🗄️ Banco de Dados MySQL (RDS - Gratuito)

1. **Criar Instância RDS:**
   - Vá em RDS → Create database
   - Engine: MySQL
   - Template: Free tier
   - DB instance identifier: `finwise-db`
   - Master username: `admin`
   - Master password: (crie uma senha forte)
   - Public access: Yes (para conectar)
   - Crie o banco

2. **Obter Endpoint:**
   - Após criar, anote o endpoint
   - Formato: `finwise-db.xxxxx.us-east-1.rds.amazonaws.com:3306`

3. **Atualizar DATABASE_URL:**
   ```bash
   DATABASE_URL=mysql://admin:senha@finwise-db.xxxxx.us-east-1.rds.amazonaws.com:3306/finwise
   ```

4. **Executar Migrações:**
   - Conecte via SSH no Elastic Beanstalk
   - Execute: `pnpm db:push`

## 🌐 Domínio Personalizado (Opcional)

1. **Comprar domínio na Route 53** (ou usar domínio existente)
2. **Configurar no Elastic Beanstalk:**
   - Configuration → Load balancer → Add listener
   - Adicione certificado SSL (gratuito via ACM)

## 💰 Custos (Tier Gratuito)

### Elastic Beanstalk:
- **GRATUITO** - Apenas paga pelos recursos EC2 usados

### EC2 (t2.micro):
- **750 horas/mês GRÁTIS** por 12 meses
- Suficiente para rodar 24/7

### RDS (MySQL):
- **750 horas/mês GRÁTIS** por 12 meses
- **20GB de storage GRÁTIS**

### Total:
- **GRATUITO por 12 meses** (dentro dos limites)
- Após 12 meses: ~$10-15/mês (se usar t2.micro)

## 🔧 Troubleshooting

**Deploy falha?**
- Verifique logs: `eb logs`
- Confirme que todas as variáveis estão configuradas
- Verifique se o build está funcionando localmente

**Aplicação não abre?**
- Verifique security groups (permitir HTTP/HTTPS)
- Confirme que o health check está passando

**Banco não conecta?**
- Verifique security groups do RDS
- Confirme que permite conexões do Elastic Beanstalk
- Teste a conexão manualmente

## 📝 Comandos Úteis

```bash
# Ver status
eb status

# Ver logs
eb logs

# Abrir aplicação
eb open

# SSH no servidor
eb ssh

# Atualizar variáveis
eb setenv VAR=valor

# Fazer deploy
eb deploy

# Listar ambientes
eb list
```

## ✅ Vantagens AWS

- Tier gratuito generoso (12 meses)
- Escalável e confiável
- Integração com outros serviços AWS
- Suporte profissional
- Documentação extensa
