# 0002. The article feed is a versioned contract; bundled content is the floor

- **Status:** Accepted
- **Date:** 2026-10-26
- **Deciders:** Chamrong

## Context
Tomlop is an offline-first app whose promise includes working with no connection. It ships 86 articles inside the APK.
New and corrected articles should reach phones without a Play Store release. Phones are modest, data is expensive for many users,
and the app declares no account.

## Decision
The web publishes `/library/library.json`, an index of every published article with its `sha256`, plus `/library/articles/<id>.md`.
The app syncs at most once a day, downloads only entries whose hash differs from what it holds (cached or bundled), verifies each hash,
and **a cached article replaces the bundled one with the same id**. The bundled 86 are the floor: if the feed is unreachable,
malformed, too new, or empty, the app behaves exactly as if the feed did not exist.
The feed carries `schemaVersion` and `minAppVersionCode`; a client that does not understand either ignores the feed.
Ids and paths are validated by strict patterns because they become filenames on the phone.

## Consequences
- Corrections to articles 1-86 ship without a release (the cached copy wins), which only works because the client compares hashes, not presence.
- Unpublishing or deleting removes an article from the feed but **cannot** remove it from a phone that already has it, and never removes a bundled one. Retraction needs a new mechanism if it ever matters (see the roadmap).
- The server never learns anything about the phone: a plain GET with a fixed `User-Agent`.
- Any change to the format is a coordination problem between two repos, so the contract is written down in [feed-schema.md](../feed-schema.md) and tested for parity.

## Alternatives considered
- **A JSON API with pagination and auth.** Needless: the library is small and public.
- **Push (FCM).** Adds Google services, a token per device, and an account-like identity. Rejected on privacy grounds.
- **Bundled content wins over the feed.** Simpler, but then the feed could only ever add article 87+, never repair 1-86.
- **Server-sent diffs.** More efficient, more complex; the whole library is about 250 KB.

## Links
[feed-schema.md](../feed-schema.md) · [FS-CONTENT-02](../flows/content/fs_content_02_feed_sync.md) · app repo `LibrarySync.kt`
