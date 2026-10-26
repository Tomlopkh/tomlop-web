# Article feed

Static files on a CDN that let Tomlop publish and correct articles without shipping a Play Store update. It is read-only and unauthenticated, shaped like files; writes go through the backoffice.

The Android app reads it (`LibrarySync.kt`, `LibraryFeed.kt` in the app repo) from version code 2 onward.

The feed is **generated from a D1 database**, not hand-maintained: a Cloudflare Worker serves `/library/library.json` and `/library/articles/<id>.md`, and the backoffice (and AI connectors) edit the articles. See [MCP.md](MCP.md) and [DEPLOY.md](DEPLOY.md).

## The rule it must not break

The bundled corpus is the floor. The app ships all 86 articles inside the APK and must stay fully usable with the network off, forever. If the feed is unreachable, misformatted or empty, the app behaves exactly as it does today.

## Layout

```
/library/library.json             index over every published article
/library/articles/<id>.md         one article's Markdown, exactly what its sha256 covers
/read/                            the same articles as web pages
/read/<id>/
```

`library/articles/*.md` in this repo is only the **seed**: `npm run db:seed` loads those 86 files
into D1 once. After that the database is the source of truth.

## Article format

Identical to the Markdown bundled in `app/src/main/assets/articles/`, so `parseReadingArticle` in `ReadingArticles.kt` needs no change. One inline style exists, `**bold**` (every bundled article uses it to lead a bullet); the app renders it with `parseMarkdownBold` and the website with `splitBold` (`shared/utils/inline.ts`), which behave identically, including for an unbalanced marker.

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

Sign in at `/admin`, or connect an AI app at `/admin/integrations` (see [MCP.md](MCP.md)). Saving an
article recomputes its `sha256`, `bytes` and reading time from the Markdown, so the feed can never
disagree with the file. Unpublishing or deleting removes an article from the feed, but a phone that
already downloaded it keeps its copy, and the 86 bundled ones stay in the app.

`server/lib/markdown.ts` mirrors `parseReadingArticle`; its test (`server/lib/markdown.test.ts`)
checks titles, reading minutes, byte counts and hashes of all 86 articles against `library/library.json`.
If the parsers drift, that test fails.

## Privacy

The sync is the only reason the app declares `INTERNET`. It sends a plain HTTPS GET with a fixed
`User-Agent: Tomlop`: no identifiers, no habit data. The privacy policy, the landing page, the
download page and the Play Data safety answers all say so; keep them in step with any change here.
