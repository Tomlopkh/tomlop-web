# 0011. Evolve the feed additively; add retraction as an optional field

- **Status:** Proposed
- **Date:** 2026-10-26
- **Deciders:** Chamrong (to confirm)

## Context
The app ships with a feed client that **ignores any feed whose `schemaVersion` it does not know** ([ADR 0002](0002-feed-is-a-contract-with-a-bundled-floor.md)). That is the right safety rule, and it is also a trap: if the web bumps `schemaVersion`, every installed app silently stops syncing. Two pending features need new feed data: article tags by life dimension (FS-LIB-01) and withdrawing an article from phones (FS-CONTENT-05). The client's parser reads only the keys it knows and ignores the rest **[Observed in `parseFeedIndex`]**.

## Decision
Within `schemaVersion` 1, feed changes are **additive and optional only**: new keys that older clients ignore, never renamed or repurposed keys, never new meanings for old keys. Adopted now: `dimensions: string[]` on entries and a top-level `retired: string[]`. A breaking change (a new `schemaVersion`) requires: a deprecation period of at least two releases during which the feed serves **both** shapes (`library.json` and a versioned `library.v2.json`), a `minAppVersionCode` plan, and an ADR.
A client-side fixture test (a v1.1.0 parser reading the extended feed) is mandatory in the web repo's tests.

## Consequences
- Old phones keep syncing forever; new fields reach only new apps.
- The web cannot remove or repurpose a field without a deprecation plan.
- Retraction works only for apps that understand `retired`; this is stated in the backoffice (honest limits).
- Each new field needs a test on both sides.

## Alternatives considered
- **Bump to schemaVersion 2 now:** simplest to reason about, but strands every installed app.
- **A second endpoint per feature:** more requests and more surface for no gain at this size.

## Links
[feed-schema.md](../feed-schema.md) · [FS-CONTENT-05](../flows/content/fs_content_05_retraction.md) · app [FS-LIB-01](../../../tomlop-mobile-android/docs/flows/library/fs_lib_01_discovery.md)
