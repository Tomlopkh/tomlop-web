# Testing strategy

Principle: put the rules in framework-free modules and test those hard; test the HTTP wiring with one scripted end-to-end run; test the visual and device behaviour by hand where automation is not yet worth it.

| Layer | What | How | Where | Status |
|---|---|---|---|---|
| Unit | Article parser, validator, bold splitter | `vitest` | `server/lib/markdown.test.ts`, `shared/utils/inline.test.ts` | 17 tests |
| Parity | All 86 bundled articles: titles, reading minutes, bytes, SHA-256 match `library/library.json`; no validator warnings | `vitest` | `markdown.test.ts` | Passing |
| Contract | The Android client's rules (feed parsing, hash diff, merge, security limits) | JUnit in the app repo | `LibrarySyncTest` (13 tests) | Passing |
| End to end | Admin sign-in, article CRUD, feed and hash, OAuth with attack cases, all MCP tools, cache purge | `scripts/e2e-local.py` against a local build | `docs/flows/*` test tables | 55 checks passing |
| Types | Vue and server types | `nuxt typecheck` | CI/manual | Clean |
| Design | Mechanical design detector, desktop and mobile screenshots, light and dark | `impeccable detect`, headless Chrome | manual | Done once (2026-10-26) |
| Device | Sync on a real phone: airplane mode, captive portal, slow link | manual | app repo research plan | **Not done** |
| Connector | Real Claude and ChatGPT against production | manual | FS-AI-01 T10 | **Not done** |

## Gaps worth closing (in order)
1. Move `e2e-local.py` into CI against `wrangler dev` with a throwaway D1, so every push proves the admin, OAuth and MCP paths. (Needs a seeded local database in CI; about a day.)
2. Add vitest tests for `oauth.ts` pure functions (PKCE, redirect rules, scope rules) with an in-memory D1 fake.
3. Browser tests for the editor: unsaved-changes guard, Ctrl/Cmd+S, inline delete confirmation, and the Write/Preview switch on a phone width (Playwright).
4. A shared fixture of article Markdown with expected parse results, consumed by both the Kotlin and TypeScript tests, so the two parsers cannot drift.

## What "done" means for a change here
Tests pass, typecheck is clean, the e2e script passes locally, and for any UI change the detector reports no findings and one batch of desktop and mobile screenshots was reviewed.
