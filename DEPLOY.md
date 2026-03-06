# Deploy da aplicação InViagem

## Opção 1: Vercel (recomendado para Next.js)

### 1. Instalar a Vercel CLI e fazer login

```bash
npm i -g vercel
vercel login
```

Siga as instruções no navegador para autorizar.

### 2. Fazer o deploy

Na pasta do projeto:

```bash
vercel
```

Na primeira vez, responda às perguntas (projeto novo, etc.). Para deploys seguintes:

```bash
vercel --prod
```

### 3. Variáveis de ambiente na Vercel

No [Dashboard da Vercel](https://vercel.com/dashboard) → seu projeto → **Settings** → **Environment Variables**, adicione:

| Variável | Descrição | Onde usar |
|----------|-----------|------------|
| `GEMINI_API_KEY` | Chave da API Gemini | Server (não expor no cliente) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Chave da API Google Maps | Build + Runtime |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Build + Runtime |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase | Build + Runtime |
| `APP_URL` | URL do app (ex: `https://seu-app.vercel.app`) | Server (callbacks, links) |

Depois de salvar as variáveis, faça um novo deploy (**Deployments** → **Redeploy**).

---

## Opção 2: Deploy manual (build + servidor)

O projeto já está configurado com `output: 'standalone'` no Next.js.

### Build

```bash
npm run build
```

### Executar em produção

O script `npm run start` espera que os arquivos estáticos estejam copiados para `.next/standalone`. No Windows:

```bash
npm run start
```

Em Linux/macOS (ou em um servidor), após o build:

```bash
cp -r .next/static .next/standalone/.next/static
PORT=3020 node .next/standalone/server.js
```

Configure as mesmas variáveis de ambiente no servidor.

---

## Resumo rápido (Vercel)

```bash
vercel login
vercel --prod
```

Depois configure as variáveis de ambiente no dashboard da Vercel.
