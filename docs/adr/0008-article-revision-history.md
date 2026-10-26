# 0008. Keep every article revision and who made it

- **Status:** Proposed
- **Date:** 2026-10-26
- **Deciders:** Chamrong (to confirm)

## Context
Today `UPDATE articles` overwrites the body. There is no history, no undo, and no record of whether a change came from the owner or an AI app.
An AI tool can replace an article's text in one call, and phones will download the change. A wrong edit to a published article is therefore distributed to users and cannot be recovered from the database.
D1 offers Time Travel (point-in-time restore of the whole database), which is a disaster tool, not an undo for one article.

## Decision
Add an append-only `article_revisions` table: `(id, article_id, body, sha256, actor, actor_kind, created_at)`.
Every create, update, publish-change and delete writes a revision in the same D1 batch as the change. `actor_kind` is `admin` or `connector`, and `actor` is the admin email or the connector's name.
The backoffice shows a history list with a restore action (restoring writes a new revision, never rewrites an old one).
Keep revisions for 180 days, or at least the last 20 per article; prune in a scheduled Worker.

## Consequences
- Roughly +1 write and a few KB per save. At realistic volume (tens of edits a day) this is far inside the free tier.
- Restoring a published article is a distributed correction: phones pick it up on their next sync. This is the desired property.
- A prerequisite for letting AI apps edit published articles without fear (see [ADR 0009](0009-editorial-states-and-review.md)).

## Alternatives considered
- **Rely on Time Travel.** Restores everything or nothing.
- **Store history in Git.** Re-introduces the workflow the backoffice replaced.

## Links
[PRD-CONTENT](../../../tomlop-mobile-android/docs/product/prd-content-platform.md) story CP-12 · [ERD](../erd/erd_content.md) (proposed table)
