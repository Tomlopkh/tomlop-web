# Deploying to Cloudflare

One Worker (`tomlop-web`) serves the site, the backoffice, the feed and the MCP endpoint at
**tomlop.chamrong.com**, with one D1 database. Everything fits Cloudflare's free tier
(D1: 5M row reads and 100k row writes a day; Workers: 100k requests a day).

## One-time setup

```sh
npm install
npx wrangler login

# 1. The database. Paste the printed database_id into wrangler.jsonc.
npx wrangler d1 create tomlop

# 2. Tables, then the 86 existing articles (INSERT OR IGNORE: safe to re-run).
npm run db:migrate
npm run db:seed

# 3. Secrets (never committed).
openssl rand -base64 48 | npx wrangler secret put NUXT_SESSION_PASSWORD
npx wrangler secret put NUXT_ADMIN_EMAIL
npm run hash-password            # prints NUXT_ADMIN_PASSWORD_HASH='…'
npx wrangler secret put NUXT_ADMIN_PASSWORD_HASH

# 4. Build and deploy.
npm run deploy
```

Until the three secrets exist, sign-in answers 503 and the admin API refuses everything.

## Domain

`wrangler.jsonc` registers `tomlop.chamrong.com` as a custom domain. If a DNS record for that
name already exists in the `chamrong.com` zone, Cloudflare refuses the route: delete the record
(or add the domain in the dashboard under the Worker's Settings → Domains & Routes) and deploy again.

## Auto-deploy

In the Cloudflare dashboard, Workers & Pages → `tomlop-web` → Settings → Build: connect the
GitHub repo `Tomlopkh/tomlop-web`, build command `npm run build`, deploy command `npx wrangler deploy`.
Every push to `main` then deploys, including the `public/download.json` that
`scripts/release.sh` in the app repo updates for each release.

## Protecting the backoffice

Sign-in is one admin, a scrypt-hashed password and a sealed HttpOnly session cookie, with a
D1-backed limit of 5 attempts per 15 minutes per address. For a second layer, put **Cloudflare
Access** (free for 50 users) in front of `/admin*`; the app keeps working because `/api/admin`
still checks the session itself. Do not put Access in front of `/mcp`, `/oauth/*` or
`/.well-known/*`: AI apps and phones must reach those.

## Local development

```sh
cp .dev.vars.example .dev.vars        # wrangler dev
cp .dev.vars .env                     # nuxt dev reads .env instead
npm run db:migrate:local && npm run db:seed:local
npm run dev                           # http://localhost:3000, local D1 in .wrangler/state
```

Set `NUXT_SESSION_COOKIE_SECURE=false` in both files only for local testing over plain HTTP.
`scripts/e2e-local.py` runs the whole admin/OAuth/MCP flow against a local build.

## Moving off GitHub Pages

The site used to be static files on GitHub Pages (`tomlopkh.github.io/tomlop-web/`). The repo
root is now a Nuxt project, so Pages deployed from `main` will no longer find an `index.html`.
Before switching Pages off, point the Play Console's privacy-policy field at
`https://tomlop.chamrong.com/privacy` and check the old links you have published elsewhere.
