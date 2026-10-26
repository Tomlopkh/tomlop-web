# 0006. Cache the public feed at the edge: short TTL plus purge on write

- **Status:** Accepted
- **Date:** 2026-10-26
- **Deciders:** Chamrong

## Context
Every phone fetches `library.json` once a day, plus changed articles. D1's free tier allows 5M row reads a day, and the index query reads every published row.
Without caching, roughly 58,000 index requests a day would exhaust the budget (86 rows each). An edit should still appear quickly.

## Decision
`/library/library.json` and `/library/articles/<id>.md` are stored in the Workers Cache API for 300 seconds. Saving, publishing or deleting through the backoffice or MCP purges that article's URLs and the index in the nearest data centre. Other data centres expire within the TTL.
The index's `generatedAt` is the newest article edit, not "now", so an unchanged feed is byte-identical.
The public reading pages are server-rendered per request (no cache yet); they read at most ~90 rows each.

## Consequences
- An unpublished article can stay visible for up to five minutes in other regions. Acceptable for content; not acceptable if a legal takedown were ever needed (then purge by zone).
- In `nuxt dev` there is no Cache API, so caching bugs only show in a deployed or `wrangler dev` build. The end-to-end script exercises this path.
- The reading pages are the next D1 consumer to cache if traffic grows.

## Alternatives considered
- **`Cache-Control` headers alone.** Workers responses are not edge-cached by headers; only the Cache API does that.
- **KV for the index.** Extra binding and eventual consistency without a clear benefit at this scale.
- **Precomputing the index on write.** Valid and cheaper per read; a likely follow-up if the index grows past a few hundred articles.

## Links
`server/utils/edge-cache.ts` · [FS-CONTENT-02](../flows/content/fs_content_02_feed_sync.md)
