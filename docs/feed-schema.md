# Article feed

A static feed that lets Tomlop publish articles without shipping a Play Store update. It is **files on a CDN, not an API** — no server, no database, no auth.

Nothing in the Android app reads this yet. It is a scaffold.

## The rule it must not break

The bundled corpus is the floor. The app ships 86 articles inside the APK and must stay fully usable with the network off, forever. Downloaded articles are additive — never a replacement, never a dependency. If the feed is unreachable, misformatted or empty, the app behaves exactly as it does today.

## Layout

```
library/
├── library.json                     index
└── articles/
    └── 87-sample-placeholder.md     one file per article
```

Served at `https://tomlopkh.github.io/tomlop-web/library/library.json`.

## Article format

Identical to the Markdown already bundled in `app/src/main/assets/articles/`, so `parseReadingArticle` in `ReadingArticles.kt` needs no change:

```markdown
# English Title / ចំណងជើងខ្មែរ

Intro paragraph, one per line.

## Section heading

- a bullet
a plain paragraph
```

The `id` is the filename without `.md`, matching how the bundled loader derives it. Keep ids unique across bundled and remote content; bundled ids run `01`–`86`, so remote content starts at `87`.

## `library.json`

| Field | Type | Meaning |
|---|---|---|
| `schemaVersion` | int | Bump only on a breaking change. A client seeing a higher version than it knows must ignore the feed and keep using bundled content. |
| `generatedAt` | ISO 8601 UTC | When the index was written. |
| `minAppVersionCode` | int | Clients below this ignore the feed entirely — the escape hatch for a format change. |
| `articles[].id` | string | Stable identifier; also the cache filename. |
| `articles[].path` | string | Relative to `library/`. |
| `articles[].titleEn` / `titleKm` | string | Mirrors the `# En / ខ្មែរ` heading so the list renders before the body is downloaded. |
| `articles[].bytes` | int | Lets the client show and cap download size. |
| `articles[].sha256` | hex | Change detection and integrity. Re-download only when this differs from the cached copy. |
| `articles[].publishedAt` | ISO date | Sort order for "new". |

## Client sync, when it is built

1. On app start, if online and the index is older than 24 h, `GET library.json`. Never block the UI on it.
2. If `schemaVersion` is unknown or `minAppVersionCode` exceeds this build, stop and use bundled content.
3. Diff against the cache: fetch only entries whose `id` is absent or whose `sha256` changed.
4. Verify each download's SHA-256 before writing it to `filesDir/library/`. Discard on mismatch.
5. At load time, concatenate bundled + cached articles, de-duplicating by `id`.
6. Every failure is silent. A user with no connection sees 86 articles and no error.

## What this costs the app

Adding this means adding the `INTERNET` permission, which changes the Play Data safety declaration and makes the current privacy claim — *"does not even request internet permission"* — untrue. `privacy/index.html` and the landing page both say so explicitly and must be rewritten in the same release. Do not ship the sync without that.

## Publishing

Add the `.md` file, then regenerate the index so `sha256`, `bytes` and `generatedAt` stay correct. Hand-editing `library.json` will eventually produce a hash mismatch and a silently rejected article.
