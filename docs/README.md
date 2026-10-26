# tomlop-web documentation

| Document | What it answers |
|---|---|
| [DEPLOY.md](DEPLOY.md) | How do I set up and deploy it? |
| [runbook.md](runbook.md) | What do I do when something goes wrong, or on a schedule? |
| [api.md](api.md) | What endpoints exist and what do they return? |
| [feed-schema.md](feed-schema.md) | What does the Android app read, and what rules must it follow? |
| [MCP.md](MCP.md) | How do I connect an AI app, and what can it do? |
| [testing.md](testing.md) | What is tested, how, and what is not? |
| [adr/](adr/README.md) | Why was each major decision made? |
| [flows/](flows/) | Step by step, how does each flow work (specs, sequence diagrams, wireframes)? |
| [erd/erd_content.md](erd/erd_content.md) | What is in the database? |
| [c4/c4_tomlop.md](c4/c4_tomlop.md) | How do the pieces fit together? |

Product strategy, PRDs, user stories, requirements, the roadmap and the risk register live in the private app repo under `docs/product/`, because they discuss plans rather than published behaviour.

## Flow specs
| ID | Flow |
|---|---|
| [FS-CONTENT-01](flows/content/fs_content_01_article_authoring.md) | Write and publish an article |
| [FS-CONTENT-02](flows/content/fs_content_02_feed_sync.md) | The app syncs new and corrected articles |
| [FS-AI-01](flows/ai/fs_ai_01_connector_oauth_mcp.md) | Connect an AI app and let it draft an article |
| [FS-ADMIN-01](flows/admin/fs_admin_01_sign_in.md) | Admin sign-in and session checks |

**Proposed** (written 2026-10-26, not built; see the private product roadmap for phases):

| ID | Flow | Decision |
|---|---|---|
| [FS-CONTENT-03](flows/content/fs_content_03_revisions.md) | Revision history and restore | [ADR 0008](adr/0008-article-revision-history.md) |
| [FS-CONTENT-04](flows/content/fs_content_04_review_and_publish.md) | Review and publish: AI drafts wait for a human | [ADR 0009](adr/0009-editorial-states-and-review.md) |
| [FS-CONTENT-05](flows/content/fs_content_05_retraction.md) | Withdraw an article from phones | [ADR 0011](adr/0011-additive-feed-evolution-and-retraction.md) |
| [FS-CONTENT-06](flows/content/fs_content_06_topics.md) | Topic backlog and editorial calendar | |
| [FS-OPS-01](flows/ops/fs_ops_01_maintenance_ci_alerting.md) | Maintenance, CI and alerting | [ADR 0012](adr/0012-opportunistic-maintenance-and-ci.md) |
| [FS-WEB-01](flows/web/fs_web_01_discoverability.md) | Public library discoverability | |
| [FS-WEB-02](flows/web/fs_web_02_releases_changelog.md) | Releases and the changelog page | |
| [FS-ADMIN-02](flows/admin/fs_admin_02_reviewer_access.md) | A reviewer signs in through Cloudflare Access | [ADR 0013](adr/0013-reviewer-access-via-cloudflare-access.md) (gate G-C) |

Conventions follow the flow-doc standard: a spec per flow with eleven sections, PlantUML sources and committed PNGs under each domain's `assets/`.
