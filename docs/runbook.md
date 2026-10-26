# Operations runbook

Everything here is for one operator. Commands run from the repo root with `npx wrangler` signed in to the Cloudflare account that owns the Worker `tomlop-web` and the D1 database `tomlop`.

## What is where
| Thing | Name |
|---|---|
| Worker | `tomlop-web`, custom domain `tomlop.chamrong.com` |
| Database | D1 `tomlop` (id in `wrangler.jsonc`) |
| Secrets | `NUXT_SESSION_PASSWORD`, `NUXT_ADMIN_EMAIL`, `NUXT_ADMIN_PASSWORD_HASH` |
| Logs | Cloudflare dashboard, Workers → `tomlop-web` → Logs (observability is on) |

## Deploy and roll back
```sh
npm test && npm run typecheck
npm run deploy                     # builds, then wrangler deploy
npx wrangler deployments list      # find the previous version id
npx wrangler rollback <version-id> # code only; the database is not rolled back
```
Database migrations are forward-only SQL files in `migrations/`. Apply with `npm run db:migrate`. Write migrations so the previous code still works with the new schema (add, do not rename or drop), because a rollback does not undo them.

## Change the admin password
```sh
npm run hash-password                                    # prompts; 12+ characters
npx wrangler secret put NUXT_ADMIN_PASSWORD_HASH         # paste the printed hash
openssl rand -base64 48 | npx wrangler secret put NUXT_SESSION_PASSWORD   # signs every session out
```
**Do this now** if the password was ever typed into a chat, ticket or shared note.

## An article was published by mistake
1. Backoffice → the article → switch to **Draft** → Save (or ask the connected assistant to unpublish it). The feed and article cache are purged in the nearest data centre at once, and elsewhere within 5 minutes.
2. Phones that already synced keep the text. To replace it, publish a corrected version with the same id: phones pick it up on their next sync (hash differs, cached wins).
3. A bundled article cannot be removed from the app; correct it the same way.

## A connected AI app misbehaves or a token leaked
Backoffice → **AI connectors** → **Disconnect** that app (tokens die immediately). If unsure which, disconnect all and reconnect the ones you recognise. To revoke everything from SQL:
```sh
npx wrangler d1 execute tomlop --remote --command "UPDATE oauth_tokens SET revoked = 1"
```

## Back up and restore the database
D1 keeps point-in-time history (Time Travel). Check the retention for your plan in Cloudflare's docs before relying on it.
```sh
npx wrangler d1 time-travel info tomlop                   # earliest restorable point
npx wrangler d1 export tomlop --remote --output backup-$(date +%F).sql   # a portable copy: do this monthly
npx wrangler d1 time-travel restore tomlop --timestamp=<ISO time>        # restores the WHOLE database
```
An export contains every article and OAuth hash. Store it as privately as the secrets.

## Run the checks locally
```sh
cp .dev.vars.example .dev.vars && cp .dev.vars .env       # set NUXT_ADMIN_EMAIL and a hash
npm run db:migrate:local && npm run db:seed:local
npm run dev
```
Local D1 state is keyed by `database_id`. If you change the id in `wrangler.jsonc`, the local database starts empty: migrate and seed again.
For the full end-to-end script see `scripts/e2e-local.py`. Never run it against production: it creates and deletes test articles.

## Free-tier limits and what to watch
| Limit (free plan) | Value | Watch |
|---|---|---|
| D1 rows read | 5,000,000 / day | Spikes on `/read` pages; the feed is cached |
| D1 rows written | 100,000 / day | Saves, OAuth tokens, rate-limit counters |
| D1 storage | 5 GB per account, 500 MB per database | Revisions, when added |
| Worker requests | 100,000 / day | Public traffic |
Confirm the current numbers on Cloudflare's pricing pages; they change.

## Known sharp edges
- `workers.dev` is disabled (not in `wrangler.jsonc`); the backoffice lives only on the custom domain.
- Expired OAuth rows and stale `rate_limits` rows are never pruned yet (roadmap).
- Cache purges reach one data centre; the TTL covers the rest.
- If the custom domain refuses to attach, a DNS record with that name already exists in the zone: remove it and deploy again.
