# Architecture decision records

Each file records one decision: the situation, what was decided, what it costs, and what was rejected.
They are never rewritten after the fact. A reversed decision gets a new record that supersedes the old one.

| # | Decision | Status |
|---|---|---|
| [0001](0001-nuxt-on-cloudflare-workers-with-d1.md) | Nuxt 4 on one Cloudflare Worker with D1 | Accepted |
| [0002](0002-feed-is-a-contract-with-a-bundled-floor.md) | The article feed is a versioned contract; bundled content is the floor | Accepted |
| [0003](0003-single-admin-sealed-session.md) | One admin, scrypt password, sealed session cookie | Accepted |
| [0004](0004-ai-authoring-through-mcp-with-oauth.md) | AI authoring through an OAuth-protected MCP endpoint | Accepted |
| [0005](0005-one-article-format-one-validator.md) | One article format and one validator, shared by server and browser | Accepted |
| [0006](0006-edge-cache-with-ttl-and-purge.md) | Cache the public feed at the edge: short TTL plus purge on write | Accepted |
| [0007](0007-leave-github-pages.md) | Leave GitHub Pages; the repo root becomes a Nuxt project | Accepted |
| [0008](0008-article-revision-history.md) | Keep every article revision and who made it | Proposed |
| [0009](0009-editorial-states-and-review.md) | Editorial states: draft, in review, published | Proposed |
| [0010](0010-privacy-preserving-measurement.md) | Measure the product without identifying anyone | Proposed |
| [0011](0011-additive-feed-evolution-and-retraction.md) | Evolve the feed additively; add retraction as an optional field | Proposed |
| [0012](0012-opportunistic-maintenance-and-ci.md) | Opportunistic maintenance and a CI gate instead of a scheduler | Proposed |
| [0013](0013-reviewer-access-via-cloudflare-access.md) | Reviewer access through Cloudflare Access identity, verified in the Worker | Proposed (gate G-C) |

Template: [template.md](template.md). App-side decisions live in the app repo's `docs/adr/`.
