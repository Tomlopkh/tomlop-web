# 0007. Leave GitHub Pages; the repo root becomes a Nuxt project

- **Status:** Accepted
- **Date:** 2026-10-26
- **Deciders:** Chamrong

## Context
The static site was published from `main` at `tomlopkh.github.io/tomlop-web/`. The privacy-policy URL in the Play listing and links in `README` and release notes pointed there.
Cloudflare now serves `tomlop.chamrong.com`.

## Decision
The repository is now a Nuxt project; GitHub Pages deployed from the branch root will have no `index.html` and stops working. The canonical privacy URL becomes `https://tomlop.chamrong.com/privacy`.
`release.sh` writes `public/download.json` instead of `download.json`. Workers Builds (or `npm run deploy`) publishes it.

## Consequences
- Anything that still links to `tomlopkh.github.io` breaks. Before switching Pages off: update the Play Console privacy field, and search for the old host.
- Releases now need a site redeploy to flip the download page to the new APK (automatic once Workers Builds is connected).
- One origin for the site, the feed and OAuth: simpler cookies, CSP and discovery.

## Alternatives considered
- **Keep Pages for the static pages and Workers for the rest.** Two hosts, two privacy URLs, and the CORS/cookie surface doubles. Rejected.

## Links
[DEPLOY.md](../DEPLOY.md) · app repo `scripts/release.sh`
