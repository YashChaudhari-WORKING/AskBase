# Deployment Pipeline

**Stack:** Vercel · Railway · Neon · Upstash · Cloudflare · Brevo  
**Cost at launch:** $0/month

---

## Architecture at a glance

```
User browser
    │
    ├── dashboard/web  →  Vercel          (Next.js 15, Edge Network)
    ├── API            →  Railway         (Express, auto-deploy from main)
    ├── Widget bundle  →  Cloudflare R2   (static JS, global CDN)
    │
    ├── Database       →  Neon            (PostgreSQL 16 + pgvector, serverless)
    ├── Cache/Pub-Sub  →  Upstash Redis   (serverless Redis, free tier)
    └── Email          →  Brevo           (300/day free, custom domain via Cloudflare DNS)
```

---

## Phase 1 — Database (Neon)

**Why Neon:** serverless Postgres with pgvector support, free tier is 0.5 GB storage + 190 compute hours/month. Auto-suspend when idle = zero cost between sessions.

### Steps

1. Go to [neon.tech](https://neon.tech) → Create account → New project
   - Name: `askbase-prod`
   - Region: `eu-west-1` (Ireland — closest to your EU users)
   - Postgres version: 16

2. Copy the connection string — format:
   ```
   postgresql://user:password@ep-xxx.eu-west-1.aws.neon.tech/neondb?sslmode=require
   ```

3. Enable pgvector in Neon console → SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

4. Save as `DATABASE_URL` — you'll paste this into Railway and Vercel.

5. Push schema:
   ```bash
   DATABASE_URL=<neon-url> pnpm --filter @askbase/api db:push
   ```

---

## Phase 2 — Cache & Pub-Sub (Upstash Redis)

**Why Upstash:** serverless Redis, 10,000 commands/day free, no always-on server cost.

### Steps

1. Go to [upstash.com](https://upstash.com) → Create account → New Database
   - Name: `askbase-redis`
   - Type: Regional
   - Region: `eu-west-1`

2. Copy from the dashboard:
   ```
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=xxx
   ```
   Or use the standard Redis URL for Socket.io:
   ```
   REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379
   ```

3. Save both — needed in Railway.

---

## Phase 3 — API (Railway)

**Why Railway:** Git-push deploys, auto-generates HTTPS URL, $5 free credit/month (enough for a hobby project).

### Steps

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
   - Connect your GitHub account
   - Select `RAG-Engine` repo
   - Root directory: `apps/api`

2. Railway auto-detects Node.js. Set build + start commands:
   - Build: `pnpm install && pnpm --filter @askbase/api build`
   - Start: `pnpm --filter @askbase/api start`

3. Add environment variables in Railway dashboard:
   ```
   NODE_ENV=production
   PORT=4000

   DATABASE_URL=<neon-connection-string>
   REDIS_URL=<upstash-redis-url>

   JWT_SECRET=<generate: openssl rand -base64 32>
   JWT_REFRESH_SECRET=<generate: openssl rand -base64 32>

   OPENAI_API_KEY=<your-key>
   GROQ_API_KEY=<your-key>

   BREVO_API_KEY=<your-key>
   EMAIL_FROM=hello@askbase.io

   FRONTEND_URL=https://askbase.vercel.app
   ```

4. Railway gives you a URL: `https://askbase-api.up.railway.app`
   - Save this as `NEXT_PUBLIC_API_URL` for Vercel

5. Custom domain (optional): Railway dashboard → Settings → Add domain → `api.askbase.io`
   - Add CNAME in Cloudflare: `api` → `askbase-api.up.railway.app`

### Auto-deploy
Railway watches `main` branch. Every `git push origin main` → Railway builds and deploys automatically. Zero manual steps after initial setup.

---

## Phase 4 — Web Dashboard (Vercel)

**Why Vercel:** built for Next.js, global edge network, free tier is generous (100GB bandwidth/month).

### Steps

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
   - Select `RAG-Engine` repo
   - Root directory: `apps/web`
   - Framework: Next.js (auto-detected)

2. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.askbase.io
   NEXT_PUBLIC_WIDGET_URL=https://widget.askbase.io
   ```

3. Deploy → Vercel gives you `askbase.vercel.app`

4. Custom domain: Vercel dashboard → Domains → Add `askbase.io`
   - In Cloudflare: set `askbase.io` A record → Vercel IP (shown in Vercel dashboard)
   - Or CNAME `www` → `cname.vercel-dns.com`
   - **Proxy status: DNS only** (grey cloud) — let Vercel handle SSL, not Cloudflare proxy

5. Auto-deploy: same as Railway — every push to `main` triggers a Vercel deploy.

---

## Phase 5 — Widget CDN (Cloudflare R2)

**Why R2:** S3-compatible object storage with zero egress fees, free tier 10GB storage + 10M requests/month. Widget is a ~50KB JS file — this costs literally nothing.

### Steps

1. Cloudflare dashboard → R2 → Create bucket → `askbase-widget`

2. Build the widget:
   ```bash
   pnpm --filter @askbase/widget build
   ```
   Output: `apps/widget/dist/widget.js`

3. Upload to R2:
   ```bash
   # Install Wrangler (Cloudflare CLI)
   npm install -g wrangler
   wrangler login

   # Upload
   wrangler r2 object put askbase-widget/widget.js \
     --file apps/widget/dist/widget.js \
     --content-type "application/javascript"
   ```

4. Enable public access: R2 bucket → Settings → Public Access → Allow

5. Custom domain: R2 → Connect Domain → `widget.askbase.io`
   - Cloudflare adds the DNS record automatically

6. Cache headers (set in Cloudflare Transform Rules):
   ```
   Cache-Control: public, max-age=31536000, immutable
   ```
   Widget URL becomes: `https://widget.askbase.io/widget.js`

### Automate widget deploy with GitHub Actions

Create `.github/workflows/widget.yml`:
```yaml
name: Deploy Widget

on:
  push:
    branches: [main]
    paths: ['apps/widget/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 8 }
      - run: pnpm install
      - run: pnpm --filter @askbase/widget build
      - name: Upload to R2
        env:
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
        run: |
          npx wrangler r2 object put askbase-widget/widget.js \
            --file apps/widget/dist/widget.js \
            --content-type "application/javascript"
```

Widget auto-deploys only when files under `apps/widget/` change.

---

## Phase 6 — Email (Brevo + Cloudflare DNS)

### Brevo setup

1. [brevo.com](https://brevo.com) → Create account → Free plan (300/day)
2. Settings → Senders & IPs → Domains → Add domain → `askbase.io`
3. Brevo shows you DNS records to add

### Cloudflare DNS records

Add these in Cloudflare DNS dashboard:

| Type | Name | Value |
|---|---|---|
| TXT | `@` | `v=spf1 include:spf.sendinblue.com ~all` |
| CNAME | `mail._domainkey` | `[value from Brevo]` |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:hello@askbase.io` |
| MX | `@` | `inbound.brevo.com` (priority 10) |

4. Back in Brevo → Verify domain → All green ✓
5. Add `BREVO_API_KEY` to Railway env vars
6. Emails now send cleanly from `hello@askbase.io` — no "via" tag

---

## Phase 7 — CI/CD (GitHub Actions)

Full automated pipeline — push to `main` → everything deploys.

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    name: API → Railway
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Trigger Railway deploy
        run: |
          curl -X POST "${{ secrets.RAILWAY_WEBHOOK_URL }}"

  deploy-web:
    name: Web → Vercel
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 8 }
      - run: pnpm install
      - run: pnpm --filter @askbase/web build
      - name: Deploy to Vercel
        run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}

  deploy-widget:
    name: Widget → Cloudflare R2
    runs-on: ubuntu-latest
    if: contains(github.event.head_commit.modified, 'apps/widget')
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 8 }
      - run: pnpm install
      - run: pnpm --filter @askbase/widget build
      - name: Upload to R2
        env:
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
        run: |
          npx wrangler r2 object put askbase-widget/widget.js \
            --file apps/widget/dist/widget.js \
            --content-type "application/javascript"
```

### GitHub Secrets to add
```
RAILWAY_WEBHOOK_URL     → Railway dashboard → Settings → Deploy Webhook
VERCEL_TOKEN            → Vercel dashboard → Settings → Tokens
CF_ACCOUNT_ID           → Cloudflare dashboard → Overview (right sidebar)
CF_API_TOKEN            → Cloudflare → My Profile → API Tokens → Create Token
```

---

## Full cost breakdown

| Service | Free Tier | Limit before paid |
|---|---|---|
| Vercel | Free | 100GB bandwidth/month |
| Railway | $5 credit/month | ~500 hours compute |
| Neon | Free | 0.5GB storage, 190 compute hrs |
| Upstash Redis | Free | 10,000 commands/day |
| Cloudflare R2 | Free | 10GB storage, 10M requests |
| Brevo | Free | 300 emails/day |
| Cloudflare DNS | Free | Unlimited |
| **Total** | **~$0/month** | |

---

## Launch checklist

```
□ Neon — project created, pgvector enabled, schema pushed
□ Upstash — Redis database created, URL copied
□ Railway — repo connected, env vars set, API live at api.askbase.io
□ Vercel — repo connected, env vars set, web live at askbase.io
□ Cloudflare R2 — bucket created, widget uploaded, widget.askbase.io live
□ Brevo — domain verified, DNS records propagated, test email sent
□ GitHub Actions — all secrets added, push to main, all three jobs green
□ End-to-end test — register → verify email → login → upload doc → chat
```
