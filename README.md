# tomlop-web

The website and backoffice for **ទម្លាប់ / Tomlop**, the Khmer-first offline habit app for Android.
A Nuxt 4 app on one Cloudflare Worker with a D1 database, live at **https://tomlop.chamrong.com**.

| Path | What it is |
|---|---|
| `/`, `/privacy`, `/download` | Landing page, privacy policy (the URL Google Play requires), APK download page driven by `public/download.json` |
| `/read/`, `/read/<id>/` | The reading library as web pages, rendered from D1 |
| `/library/library.json`, `/library/articles/<id>.md` | The article feed the Android app syncs from ([docs/feed-schema.md](docs/feed-schema.md)) |
| `/admin` | Backoffice: sign in, write, publish and delete articles |
| `/admin/integrations`, `/mcp`, `/oauth/*` | AI connectors: let Claude or ChatGPT add articles ([docs/MCP.md](docs/MCP.md)) |

The app source lives in the private `Tomlopkh/tomlop-mobile-android`. Everything served here is public content;
secrets are Cloudflare secrets and are never in this repo.

## Layout

```
app/            Nuxt pages, layouts, components (public site + the /admin client app)
server/api/     /api/admin/* (guarded) and /api/read/* (public)
server/routes/  /library/*, /mcp, /oauth/*, /.well-known/*
server/lib/     articles (D1 + validation), markdown parser, feed, oauth, mcp (framework-free, unit-tested)
shared/         inline **bold** splitter (used by the site; mirrors the Android reader), D1 type shim
migrations/     D1 schema: articles, OAuth for AI connectors, rate limits
library/        the 86 original articles: the one-time seed, and the parity fixture for the tests
scripts/        hash-password.mjs, seed-d1.py, e2e-local.py
public/         assets (stylesheet, marks), download.json
```

## Develop

```sh
npm install
cp .dev.vars.example .dev.vars && cp .dev.vars .env     # then set NUXT_ADMIN_EMAIL and a hash from `npm run hash-password`
npm run db:migrate:local && npm run db:seed:local
npm run dev                                             # http://localhost:3000, local D1 in .wrangler/state
npm test && npm run typecheck
```

Deploying, secrets, the domain and moving off GitHub Pages: [docs/DEPLOY.md](docs/DEPLOY.md).

## Article format

One tiny format shared with the Android app: `# English / ខ្មែរ`, intro lines, `## sections` of plain lines and
`- bullets`, and one inline style, `**bold**`. The validator reports anything else as a warning, because the app
and the website would show it as literal characters.

## Releases

The Android source repo is private, so a release asset there is not publicly downloadable. Signed APKs are published to
**this** repo's GitHub Releases, and `scripts/release.sh` in the app repo updates `public/download.json` to point at the
newest one. The download page reads that file, so it needs no API call and keeps its not-yet state if the fetch fails.

## Before launch

- Replace `CONTACT_EMAIL` in `app/pages/privacy.vue` with a real address.
- Have a native Khmer reader proofread the privacy page and landing page, including the wording added for article updates.
- Point the Play listing's privacy policy field at `/privacy`.
