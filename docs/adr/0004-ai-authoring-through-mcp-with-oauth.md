# 0004. AI authoring through an OAuth-protected MCP endpoint

- **Status:** Accepted
- **Date:** 2026-10-26
- **Deciders:** Chamrong

## Context
Writing Khmer articles is the bottleneck of the library. The owner wants to ask Claude or ChatGPT to draft articles and have them land in the backoffice.
Both products speak the Model Context Protocol (MCP) and require OAuth 2.1 with dynamic client registration for remote servers.
The owner's chamrong.com already implements exactly this and was used as the reference.

## Decision
Expose `POST /mcp` (Streamable HTTP, stateless, JSON replies) with eight tools: `get_platform_guide`, `list_articles`, `get_article`, `check_article`,
`create_article` (always a draft), `update_article`, `publish_article`, `delete_article` (marked destructive).
Protect it with OAuth 2.1: dynamic client registration, authorization code with PKCE (S256), consent on `/admin/connect` behind the admin sign-in,
one-hour access tokens bound to `<site>/mcp`, 30-day refresh tokens that rotate on every use. Replaying a code or an old refresh token revokes the whole grant.
Only SHA-256 hashes of codes and tokens are stored. The grant is one scope, `articles`; the connector cannot touch anything else.
Creating always yields a draft; publishing is a separate tool call the assistant is instructed to make only when the owner says so.

## Consequences
- The assistant can publish and delete, so the human gate is **policy** (the guide and the app's confirmation for destructive tools) rather than **mechanism**. See [ADR 0009](0009-editorial-states-and-review.md), which proposes making it a mechanism.
- Every connection attempt leaves a registered client behind; the admin page lets the owner clear unfinished ones.
- An AI can write plausible but wrong Khmer. The validator catches format errors, not meaning or tone. Human reading before publishing is the control.
- Token lifetimes and rotation follow OAuth 2.1; there is no per-tool permission yet.

## Alternatives considered
- **A static API key.** Simple, but ChatGPT and Claude connectors require OAuth, and a leaked key has no expiry or per-app revocation.
- **Direct database access for the assistant.** Bypasses validation. Rejected.
- **Webhook that the assistant posts to.** Not supported by the connector UIs.

## Links
[FS-AI-01](../flows/ai/fs_ai_01_connector_oauth_mcp.md) · [MCP guide](../MCP.md) · `server/lib/oauth.ts` · `server/lib/mcp/`
