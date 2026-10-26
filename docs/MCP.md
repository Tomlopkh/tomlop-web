# AI connectors (MCP): add articles by chatting with Claude or ChatGPT

The site runs an [MCP](https://modelcontextprotocol.io) server at **`https://tomlop.chamrong.com/mcp`**.
Connect it to an AI app and ask in plain words, for example:

> Write a draft article in Khmer on starting a habit when you only have two minutes.

The assistant reads the article guide, writes the article as a **draft**, checks it, and
publishes only when you say so. Everything lives in the same D1 database as the backoffice, so
a published article reaches the website within minutes and phones on their next sync.

## Connect

Use the URL exactly as shown on **/admin/integrations** (OAuth tokens are bound to it).

| App | Steps |
|---|---|
| **Claude** (claude.ai, desktop, mobile) | Settings → Connectors → Add custom connector → paste the URL → Connect. |
| **ChatGPT** | Settings → Apps & Connectors → Advanced → Developer mode → Create → paste the URL, authentication OAuth. Enable it from the **+** menu in each chat. |
| **Claude Code** | `claude mcp add --transport http tomlop https://tomlop.chamrong.com/mcp`, then `/mcp` to sign in. |
| **MCP Inspector** | `npx @modelcontextprotocol/inspector`, transport "Streamable HTTP", the same URL. |

A window opens on `/admin/connect`: sign in as the admin, read what the app asks for, press
**Allow**. **/admin/integrations → Connected apps** lists every connection and disconnects any
of them immediately.

## Tools

| Tool | What it does |
|---|---|
| `get_platform_guide` | The article format, ids, limits, style and workflow. The assistant reads this first. |
| `list_articles`, `get_article` | Read every article, drafts included. `list_articles` also returns `suggestedNextId`. |
| `check_article` | Validate Markdown without saving: errors, and warnings about syntax that would show up literally. |
| `create_article` | Save a new article as a **draft**. |
| `update_article` | Replace an article's Markdown. Does not change whether it is published. |
| `publish_article` | Publish, or send back to draft. |
| `delete_article` | Remove an article (marked destructive, so apps ask first). |

There is also a `write_article` prompt (propose → outline → draft) and the guide as the
resource `tomlop://guide`. It **cannot** touch anything except articles.

## How it works

- **Transport:** Streamable HTTP, stateless, JSON replies (`server/routes/mcp.ts`, `server/lib/mcp/`).
  Protocol versions 2025-06-18, 2025-03-26, 2024-11-05.
- **Auth:** OAuth 2.1 (`server/lib/oauth.ts`): dynamic client registration, authorization code with
  PKCE (S256), consent on `/admin/connect` behind the admin sign-in, one-hour access tokens bound
  to `<site>/mcp`, 30-day refresh tokens that rotate on every use. Replaying a code or an old
  refresh token revokes that whole grant. Only SHA-256 hashes of codes and tokens are stored
  (D1 tables `oauth_clients`, `oauth_codes`, `oauth_tokens`).
- **Discovery:** `/.well-known/oauth-protected-resource` (and `/mcp`), `/.well-known/oauth-authorization-server`,
  `/.well-known/openid-configuration`.
- **Validation:** one validator (`server/lib/articles.ts`) for the backoffice form and the AI
  connector, so an article that saves in one saves in the other.
- **Origin:** the canonical origin comes from `runtimeConfig.public.siteUrl`
  (`NUXT_PUBLIC_SITE_URL`), never the Host header.

## Troubleshooting

- **"Connect" does nothing / invalid redirect:** remove the connector and add it again; it re-registers.
- **401 after a while:** the app should refresh on its own; if not, disconnect and connect.
- **ChatGPT lists no tools:** it keeps the list it scanned when the app was created. Refresh the
  app in Settings → Apps, then start a new chat.
- **Saved but not on the site:** drafts are hidden. Ask the assistant to publish.
- **Published but not on a phone yet:** phones check the feed at most once a day.
