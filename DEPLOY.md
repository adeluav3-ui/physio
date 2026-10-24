# Rehab360 — Production Deployment Guide

> Last updated: 2026-10-24

## Architecture

| Layer | Host | Notes |
|-------|------|-------|
| **API** | Render Web Service (Docker) | `physio-api`, Frankfurt `starter` plan |
| **Redis** | Render Key Value | `physio-redis`, auto-linked to API |
| **Database** | Neon Postgres | Frankfurt region, single branch for prod |
| **Web** | Vercel | Next.js 15 App Router, Frankfurt edge preferred |

---

## Step-by-step deploy order

Follow these steps **in order**. Do not start the next step until the current one shows green/OK.

### 1. Provision Neon Postgres (Frankfurt)

1. Create a new Neon project → region: **eu-central-1 (Frankfurt)**.
2. Copy the connection string from the Neon dashboard (it looks like
   `postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`).
3. Save it — this becomes `DATABASE_URL` on the API service.

### 2. Deploy the Render Blueprint

1. Push this repo to GitHub (the `main` branch after the merge).
2. In Render → **New → Blueprint** → select this repo → Render will detect `render.yaml`.
3. Render auto-creates two services: `physio-api` (Web) and `physio-redis` (Key Value).
4. Fill in every `sync: false` variable (see table below) before clicking **Apply**.
5. On first deploy Render runs the `preDeployCommand`:
   ```
   cd /app && pnpm --filter @physio/db exec prisma migrate deploy
   ```
   This applies all migrations to Neon. **Wait for this to finish before moving on.**

### 3. Seed the admin account

Once the API service shows **Live**, run the seed from your local machine (or a Render Shell):

```bash
DATABASE_URL="<neon-connection-string>" \
ADMIN_EMAIL="your@email.com" \
ADMIN_PASSWORD="<strong-password-min-12-chars>" \
pnpm --filter @physio/db seed
```

The seed is **idempotent** — safe to re-run. It only creates the admin if that email does not already exist.

### 4. Deploy the web app to Vercel

1. Import the repo in Vercel → set **Root Directory** to `apps/web`.
2. Framework preset: **Next.js**.
3. Add the Vercel env vars from the table below.
4. Deploy. Vercel's build command is `pnpm build` (set in `package.json`).

### 5. Wire CORS

Set `APP_URL` on the Render API service to your Vercel URL (e.g. `https://rehab360.vercel.app`).
Redeploy the API after changing it — CORS is read at startup.

### 6. Smoke test

```bash
API_URL=https://physio-api.onrender.com \
WEB_URL=https://rehab360.vercel.app \
bash scripts/post-deploy-check.sh
```

---

## Environment variables

### Render API service (`physio-api`)

| Variable | Required | What it is | How to set |
|----------|----------|------------|------------|
| `NODE_ENV` | ✓ | Must be `production` | Hardcoded in render.yaml |
| `PORT` | ✓ | API listen port | `4000` (hardcoded in render.yaml) |
| `DATABASE_URL` | ✓ | Neon Postgres connection string | Copy from Neon dashboard; include `?sslmode=require` |
| `REDIS_URL` | ✓ | Redis connection string | Auto-injected by Render from `physio-redis` service |
| `JWT_SECRET` | ✓ | HMAC secret for JWTs | **Generate:** `openssl rand -hex 32` — must be ≥ 32 chars |
| `JWT_EXPIRES_IN` | ✓ | JWT lifetime | `7d` (or `24h` for tighter sessions) |
| `APP_URL` | ✓ | Vercel web URL (CORS allowed origin) | `https://your-project.vercel.app` |
| `RESEND_API_KEY` | ✓ | Resend email API key | From resend.com dashboard; a placeholder disables delivery with a warning |
| `EMAIL_FROM` | ✓ | From address on all emails | `Rehab360 <no-reply@mail.rehab360.ng>` |
| `VIDEO_PROVIDER` | ✓ | Video backend | `DAILY` (hardcoded in render.yaml) |
| `DAILY_API_KEY` | ✓ | Daily.co API key | From app.daily.co → Developers → API keys |
| `DAILY_DOMAIN` | ✓ | Daily.co subdomain (without `.daily.co`) | From Daily.co dashboard |
| `PAYSTACK_SECRET_KEY` | ✓ | Paystack secret key | **Test:** `sk_test_...` / **Live:** `sk_live_...` — **never set `PAYSTACK_TEST_BYPASS`** |
| `PAYSTACK_PUBLIC_KEY` | – | Paystack public key (reserved) | `pk_test_...` / `pk_live_...` — not currently used by API |
| `PLATFORM_FEE_BPS` | ✓ | Platform commission in basis points | `1500` = 15% |
| `PROXY_SHARED_SECRET` | ✓ | Shared secret between Next.js proxy and API for verified client-IP forwarding | **Generate:** `openssl rand -hex 32` — use the **same value** on both Render and Vercel |
| `ADMIN_EMAIL` | once | Admin seed email | Set before first seed run; can be unset afterwards |
| `ADMIN_PASSWORD` | once | Admin seed password | Set before first seed run; can be unset afterwards |

> **`PAYSTACK_TEST_BYPASS`** must **never** be set in production. The API calls `process.exit(1)` at boot if it finds this variable when `NODE_ENV=production`.

### Render Key Value (`physio-redis`)

No manual variables. Render auto-configures the service and injects `REDIS_URL` into the API.

### Vercel web app (`apps/web`)

| Variable | Required | What it is |
|----------|----------|------------|
| `API_URL` | ✓ | Server-side URL to Render API — `https://physio-api.onrender.com` |
| `APP_URL` | ✓ | This web app's own URL — `https://your-project.vercel.app` (for `metadataBase`) |
| `PROXY_SHARED_SECRET` | ✓ | **Same value** as set on Render API |
| `NEXT_PUBLIC_WHATSAPP_PATIENTS` | – | WhatsApp link for patients; falls back to `#` if unset |
| `NEXT_PUBLIC_WHATSAPP_PHYSIO` | – | WhatsApp link for physiotherapy enquiries |
| `NEXT_PUBLIC_WHATSAPP_SPEECH` | – | WhatsApp link for speech therapy enquiries |
| `NEXT_PUBLIC_WHATSAPP_OT` | – | WhatsApp link for occupational therapy enquiries |
| `NEXT_PUBLIC_WHATSAPP_PROSTHETIST` | – | WhatsApp link for prosthetics enquiries |
| `NEXT_PUBLIC_WHATSAPP_ORTHOTIST` | – | WhatsApp link for orthotics enquiries |

> `NEXT_PUBLIC_*` vars are inlined at build time (visible in browser bundles). Do not put secrets in them.

---

## Generating secrets

```bash
# JWT_SECRET and PROXY_SHARED_SECRET — run once each, store in your password manager
openssl rand -hex 32

# ADMIN_PASSWORD — use a passphrase manager or:
openssl rand -base64 24
```

---

## Webhook — Paystack

Paystack signs webhook payloads with **`PAYSTACK_SECRET_KEY`** (the same key used for API calls — no separate webhook secret).
The API verifies the `x-paystack-signature` header on every incoming `POST /api/payments/paystack/webhook` request.

In Paystack dashboard → Webhooks, set the URL to:
```
https://physio-api.onrender.com/api/payments/paystack/webhook
```

---

## Production stub guard

`PAYSTACK_TEST_BYPASS=1` activates the stub payment provider (returns a fake `authorizationUrl`).
This **must never be set in production** — the API exits immediately at boot if it detects the variable while `NODE_ENV=production`.

---

## Rollback

Render keeps previous Docker images. To roll back:
1. Render dashboard → `physio-api` → **Deploys** → select the previous successful deploy → **Redeploy**.
2. If the migration added columns with defaults (all migrations to date are additive-only), no down-migration is needed.

---

## Database migrations

Migrations run automatically via the Render `preDeployCommand` on every deploy:
```
cd /app && pnpm --filter @physio/db exec prisma migrate deploy
```
All migrations in `packages/db/prisma/migrations/` are **additive-only** (no destructive changes). Safe to deploy with zero downtime on Neon.
