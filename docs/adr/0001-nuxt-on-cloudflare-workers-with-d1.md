# 0001. Nuxt 4 on one Cloudflare Worker with D1

- **Status:** Accepted
- **Date:** 2026-10-26
- **Deciders:** Chamrong

## Context
The site began as static HTML on GitHub Pages: a landing page, a privacy policy, a download page and 86 articles
generated into HTML by a Python script. The owner then wanted three things a static site cannot do: a backoffice to
add articles without a commit, an API the Android app reads dynamically, and AI-assisted authoring.
The owner already runs Nuxt on Cloudflare Workers (chamrong.com) and the domain `tomlop.chamrong.com` already pointed at a Worker.
Cloudflare's free tier covers D1 (5M row reads and 100k row writes a day) and Workers (100k requests a day).

## Decision
One Nuxt 4 application, deployed as one Cloudflare Worker (`tomlop-web`), with one D1 database (`tomlop`).
Public pages that never change (`/`, `/privacy`, `/download`) are prerendered and served as static assets without waking the Worker.
Everything dynamic (`/read`, `/library`, `/api`, `/admin`, `/mcp`, `/oauth`) runs in the Worker.
Business logic lives in framework-free modules under `server/lib/` so it is unit-tested without a server.

## Consequences
- One deploy, one domain, one set of secrets; no separate API service to run or pay for.
- D1 is SQLite: single writer, modest scale. Fine for a content library; wrong for per-user habit data (which stays on the phone, see the app repo's ADR 0001).
- Local development needs D1's local state keyed by `database_id`; changing the id starts an empty local database (this happened once; see [runbook](../runbook.md)).
- The free plan's daily limits are a hard ceiling, mitigated by edge caching ([ADR 0006](0006-edge-cache-with-ttl-and-purge.md)).

## Alternatives considered
- **Keep GitHub Pages and commit Markdown.** Cheapest, but no backoffice, no AI authoring, and every edit needs git. Rejected.
- **Separate API Worker plus static site.** Two deploys, two configs, CORS. No benefit at this size. Rejected.
- **Supabase/Neon Postgres.** More capable, but another account, another bill, and network hops from the edge. Revisit if relational reporting is needed.
- **Plain Worker without Nuxt** (the first prototype). Worked, but the admin UI and public pages became hand-rolled string templates. Rejected for maintainability.

## Links
[C4 diagrams](../c4/c4_tomlop.md) · [ERD](../erd/erd_content.md) · `nuxt.config.ts` · `wrangler.jsonc`
