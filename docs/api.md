# API reference

Base: `https://tomlop.chamrong.com`. Errors from Nitro have the shape `{ "statusCode", "statusMessage", "message" }`.
"Admin" means a valid admin session cookie; non-GET admin requests also need a same-origin `Origin` header.

## Public
| Method and path | Auth | Returns |
|---|---|---|
| `GET /library/library.json` | none | The feed index ([feed-schema.md](feed-schema.md)); cached 300 s |
| `GET /library/articles/:id.md` | none | One published article's Markdown; `404` for drafts |
| `GET /api/read` | none | Published list for the website |
| `GET /api/read/:id` | none | One parsed article with `prev` and `next` |
| `GET /read/`, `/read/:id/` | none | Server-rendered pages |
| `GET /download.json` | none | `{ released, version, apkUrl, bytes, sha256, releasedAt, minAndroid }` |

## Admin
| Method and path | Body | Returns |
|---|---|---|
| `POST /api/admin/auth/login` | `{ email, password }` | `200`, sets the session cookie. `401`, `403`, `429`, `503` |
| `POST /api/admin/auth/logout` | none | `200` |
| `GET /api/admin/articles` | none | `{ suggestedNextId, articles[] }` |
| `GET /api/admin/articles/:id` | none | `{ id, markdown, published, readingMinutes, updatedAt }` |
| `POST /api/admin/articles` | `{ id, markdown, published? }` | `{ ok, warnings[] }`; `422` on validation |
| `PUT /api/admin/articles/:id` | `{ markdown, published }` | `{ ok, warnings[] }` |
| `DELETE /api/admin/articles/:id` | none | `{ ok }` |
| `GET /api/admin/oauth/connections` | none | `{ mcpUrl, connections[{ id, name, createdAt, lastUsed, active }] }` |
| `DELETE /api/admin/oauth/connections/:id` | none | `{ ok }`; revokes tokens and forgets the client |
| `GET /api/admin/oauth/request` | the authorization query | Consent details |
| `POST /api/admin/oauth/approve` | `{ params, approve }` | `{ redirect }` |

## AI connector
`POST /mcp` (JSON-RPC 2.0, `Authorization: Bearer`), `/oauth/register|authorize|token|revoke`, and the `/.well-known/*` discovery documents. Details and tool list: [FS-AI-01](flows/ai/fs_ai_01_connector_oauth_mcp.md), [MCP.md](MCP.md).

## Conventions
- Validation failures are `422` with a human-readable `message`. Malformed bodies are `400`.
- Rate limits: sign-in 5 / 15 min; OAuth registration 20 / hour; token 60 / 10 min (per client address, D1-backed). Over the limit is `429` with `Retry-After`.
- Public reads are edge-cached for 300 s and purged on writes made through the admin API or MCP. A direct database edit is not purged; use the runbook.
