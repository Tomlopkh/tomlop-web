# 0009. Editorial states: draft, in review, published

- **Status:** Proposed
- **Date:** 2026-10-26
- **Deciders:** Chamrong (to confirm)

## Context
Articles have two states: draft and published. An AI connector holds the `articles` scope, which includes `publish_article`. The human gate ("publish only when the owner says so") exists in the assistant's instructions and the connector's confirmation prompt, not in the server.
Khmer quality is the library's core promise (PRODUCT.md: "proofread Khmer"); a fluent but subtly wrong AI article that reaches phones damages that promise.

## Decision
Introduce a third state, `in_review`, and split the scope: the connector scope `articles:write` can create and edit drafts and move a draft to `in_review`, but **cannot publish or delete**.
Publishing and deleting require the admin session. The backoffice dashboard shows a review queue. A native Khmer reader (not necessarily the owner) can be given reviewer access in a later phase (needs a second admin, which revisits [ADR 0003](0003-single-admin-sealed-session.md)).

## Consequences
- The most damaging mistake (an unreviewed article on every phone) becomes impossible through the connector rather than merely discouraged.
- One more click for the owner. This is the intended friction.
- Existing connected apps keep the old scope until reconnected; the consent screen must show what is being granted.

## Alternatives considered
- **Keep policy-only control.** Cheapest, and what exists. Fails the first time a model publishes on its own judgement.
- **Time-delayed publishing.** Adds waiting, not review.

## Links
[PRD-CONTENT](../../../tomlop-mobile-android/docs/product/prd-content-platform.md) stories CP-13, CP-14
