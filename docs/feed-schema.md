# Article feed

Static files on a CDN that let Tomlop publish and correct articles without shipping a Play Store update. It is **files, not an API** — no server, no database, no auth.

Nothing in the Android app reads it yet. The web half is live; the client is not built.

## The rule it must not break

The bundled corpus is the floor. The app ships all 86 articles inside the APK and must stay fully usable with the network off, forever. If the feed is unreachable, misformatted or empty, the app behaves exactly as it does today.

## Layout

```
library/
├── library.json                  index over every article
└── articles/
    ├── 01-perception-limits.md
    └── …  86 files
read/                             the same articles as web pages
├── index.html
└── <id>/index.html
```

Served from `https://tomlopkh.github.io/tomlop-web/library/library.json`.

The same Markdown feeds both the app and the website, so an article is written once.

## Article format

Identical to the Markdown bundled in `app/src/main/assets/articles/`, so `parseReadingArticle` in `ReadingArticles.kt` needs no change:

```markdown
# English Title / ចំណងជើងខ្មែរ

Intro paragraph, one per line.

## Section heading

- a bullet
a plain paragraph
```

The `id` is the filename without `.md`, matching how the bundled loader derives it. Bundled ids run `01`–`86`; new articles continue from `87`.

## `library.json`

| Field | Type | Meaning |
|---|---|---|
| `schemaVersion` | int | Bump only on a breaking change. A client seeing a higher version than it knows must ignore the feed and keep using bundled content. |
| `generatedAt` | ISO 8601 UTC | When the index was written. |
| `minAppVersionCode` | int | Clients below this ignore the feed entirely — the escape hatch for a format change. |
| `articles[].id` | string | Stable identifier; also the cache filename. |
| `articles[].path` | string | Relative to `library/`. |
| `articles[].titleEn` / `titleKm` | string | Mirrors the `# En / ខ្មែរ` heading so a list renders before any body is downloaded. |
| `articles[].readingMinutes` | int | Same formula the app uses, so both agree. |
| `articles[].bytes` | int | Lets the client show and cap download size. |
| `articles[].sha256` | hex | Change detection and integrity. Re-download only when this differs from the cached copy. |

## Client sync, when it is built

1. On app start, if online and the index is older than 24 h, `GET library.json`. Never block the UI on it.
2. If `schemaVersion` is unknown or `minAppVersionCode` exceeds this build, stop and use bundled content.
3. Diff against the cache: fetch entries whose `id` is absent from the cache, or whose `sha256` differs from the cached copy.
4. Verify each download's SHA-256 before writing it to `filesDir/library/`. Discard on mismatch.
5. At load time, merge bundled and cached articles by `id`. **A cached article wins over the bundled one with the same id.**
6. Every failure is silent. A user with no connection sees 86 articles and no error.

### Why the cached copy wins

The feed carries all 86 bundled articles, not just new ones. That is what makes a correction shippable: fix a typo in the Markdown, regenerate, and clients pick it up on their next sync without a Play release. If the bundled copy won instead, the feed could only ever add article 87 and never repair 1 through 86.

The cost is that step 3 must compare hashes, not just check for presence. A client that only checks presence will never see a correction.

## Publishing

Add or edit the `.md`, then regenerate — never hand-edit `library.json`:

```sh
python3 scripts/build-library.py
```

It rewrites `library/library.json` and every page under `read/`. Hand-editing the index produces a hash mismatch and a silently rejected article.

The generator's Markdown parser mirrors `parseReadingArticle`. If one starts accepting syntax the other does not, the same file renders differently in the app and on the web — keep them in step.

## What this costs the app

Adding sync means adding the `INTERNET` permission. That changes the Play Data safety declaration and makes the privacy policy's current claim — *"does not even request internet permission"* — untrue. `privacy/index.html` and the landing page both say it explicitly and must be rewritten in the same release. Do not ship the sync without that.
