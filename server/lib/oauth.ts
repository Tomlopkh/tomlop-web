/**
 * OAuth 2.1 authorization server for AI connectors (Claude, ChatGPT) that use /mcp.
 *
 * - Clients register themselves (RFC 7591 dynamic client registration), as connectors do.
 * - The admin approves each connection on /admin/connect, signed in.
 * - Authorization code + PKCE (S256). Access tokens last one hour; refresh tokens rotate on
 *   every use and last 30 days. Only SHA-256 hashes of codes and tokens are stored.
 * - Tokens are bound to the MCP resource URL (RFC 8707) and the `articles` scope.
 *
 * Pure of any HTTP framework: callers pass the D1 database and the resource URL.
 */
export const OAUTH_SCOPE = 'articles'
export const ACCESS_TTL = 60 * 60 * 1000
export const REFRESH_TTL = 30 * 24 * 60 * 60 * 1000
const CODE_TTL = 5 * 60 * 1000

export interface OAuthClient {
  id: string
  name: string
  redirectUris: string[]
  secretHash: string | null
  createdAt: number
}

export interface AuthorizeRequest {
  clientId: string
  redirectUri: string
  codeChallenge: string
  state?: string
  scope: string
  resource: string
}

/** A problem that must be shown to the person, never redirected to the client's URI. */
export class OAuthHttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
  }
}

/** An error in the OAuth protocol sense, returned as JSON by the token endpoint. */
export class OAuthError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 400) {
    super(message)
  }
}

// Clients may add standard scopes to ours: ChatGPT asks for `offline_access` (refresh tokens
// are always issued here) and OpenID-style clients send `openid profile email`. They are
// ignored; the grant is always `articles`. Anything else is refused.
const IGNORED_SCOPES = new Set(['offline_access', 'openid', 'profile', 'email'])
export function isAcceptableScope(scope: unknown): boolean {
  return String(scope || OAUTH_SCOPE).split(/\s+/).filter(Boolean).every((s) => s === OAUTH_SCOPE || IGNORED_SCOPES.has(s))
}

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function randomToken(bytes = 32): string {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)))
}

export async function sha256(value: string): Promise<string> {
  return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))))
}

/** PKCE S256: BASE64URL(SHA256(verifier)) must equal the challenge sent to /authorize. */
export async function verifyPkce(verifier: string, challenge: string): Promise<boolean> {
  if (!/^[\w.~-]{43,128}$/.test(verifier)) return false
  return (await sha256(verifier)) === challenge
}

/** HTTPS anywhere, or plain HTTP on loopback only (desktop clients, local inspectors). No fragments. */
export function isAllowedRedirectUri(uri: string): boolean {
  try {
    const url = new URL(uri)
    if (url.hash) return false
    if (url.protocol === 'https:') return true
    return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  }
  catch {
    return false
  }
}

const sameResource = (a: string, b: string) => a.replace(/\/+$/, '') === b.replace(/\/+$/, '')

export async function registerClient(db: D1Database, input: { name: string, redirectUris: string[], confidential: boolean }) {
  const id = `mcp_${randomToken(12)}`
  const secret = input.confidential ? randomToken(32) : null
  await db
    .prepare('INSERT INTO oauth_clients (id, name, redirect_uris, secret_hash, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, input.name, JSON.stringify(input.redirectUris), secret ? await sha256(secret) : null, Date.now())
    .run()
  return { id, secret }
}

export async function getClient(db: D1Database, id: string): Promise<OAuthClient | null> {
  if (!/^mcp_[\w-]{8,40}$/.test(id)) return null
  const row = await db
    .prepare('SELECT id, name, redirect_uris, secret_hash, created_at FROM oauth_clients WHERE id = ?')
    .bind(id)
    .first<{ id: string, name: string, redirect_uris: string, secret_hash: string | null, created_at: number }>()
  if (!row) return null
  return { id: row.id, name: row.name, redirectUris: JSON.parse(row.redirect_uris) as string[], secretHash: row.secret_hash, createdAt: row.created_at }
}

/** Confidential clients must present their secret; public clients rely on PKCE alone. */
export async function authenticateClient(client: OAuthClient, secret: string | undefined): Promise<boolean> {
  if (!client.secretHash) return true
  return !!secret && (await sha256(secret)) === client.secretHash
}

type RedirectError = { error: string, description: string, redirectUri: string, state?: string }

/**
 * Check an authorization request before showing the consent screen. Errors that make the
 * redirect URI untrustworthy are thrown (never redirect to an unknown URI); the rest are
 * returned so they can be sent back to the client as `error=` on its redirect URI.
 */
export async function checkAuthorizeRequest(
  db: D1Database,
  resource: string,
  q: Record<string, unknown>,
): Promise<{ client: OAuthClient, request: AuthorizeRequest } | { client: OAuthClient, redirectError: RedirectError }> {
  const clientId = String(q.client_id || '')
  const redirectUri = String(q.redirect_uri || '')
  const client = await getClient(db, clientId)
  if (!client) throw new OAuthHttpError(400, 'This connector is not registered. Remove it and add it again.')
  if (!client.redirectUris.includes(redirectUri)) throw new OAuthHttpError(400, 'The redirect URI does not match the registered connector.')
  const state = q.state ? String(q.state).slice(0, 500) : undefined
  const fail = (error: string, description: string) => ({ client, redirectError: { error, description, redirectUri, state } })

  if (q.response_type !== 'code') return fail('unsupported_response_type', 'Only response_type=code is supported.')
  const challenge = String(q.code_challenge || '')
  const pkce = q.code_challenge_method === 'S256' && /^[\w-]{43}$/.test(challenge)
  // Public clients must use PKCE. Confidential clients prove themselves with a secret at the
  // token endpoint, so PKCE is optional for them.
  if (!pkce && (challenge || q.code_challenge_method || !client.secretHash)) return fail('invalid_request', 'PKCE with code_challenge_method=S256 is required.')
  if (!isAcceptableScope(q.scope)) return fail('invalid_scope', `The only scope is "${OAUTH_SCOPE}".`)
  const asked = String(q.resource || resource)
  if (!sameResource(asked, resource)) return fail('invalid_target', 'Tokens can only be issued for this site\'s MCP endpoint.')
  return { client, request: { clientId, redirectUri, codeChallenge: pkce ? challenge : '', state, scope: OAUTH_SCOPE, resource } }
}

export function redirectWith(uri: string, params: Record<string, string | undefined>): string {
  const url = new URL(uri)
  for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, v)
  return url.toString()
}

export async function issueCode(db: D1Database, request: AuthorizeRequest): Promise<string> {
  const code = randomToken(32)
  await db
    .prepare('INSERT INTO oauth_codes (code_hash, client_id, redirect_uri, code_challenge, scope, resource, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(await sha256(code), request.clientId, request.redirectUri, request.codeChallenge, request.scope, request.resource, Date.now() + CODE_TTL)
    .run()
  return code
}

export interface TokenPair { access_token: string, token_type: 'Bearer', expires_in: number, refresh_token: string, scope: string }

async function issueTokens(db: D1Database, clientId: string, scope: string, resource: string, family: string): Promise<TokenPair> {
  const access = randomToken(32)
  const refresh = randomToken(32)
  const now = Date.now()
  const insert = 'INSERT INTO oauth_tokens (token_hash, kind, client_id, scope, resource, family, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  await db.batch([
    db.prepare(insert).bind(await sha256(access), 'access', clientId, scope, resource, family, now + ACCESS_TTL, now),
    db.prepare(insert).bind(await sha256(refresh), 'refresh', clientId, scope, resource, family, now + REFRESH_TTL, now),
  ])
  return { access_token: access, token_type: 'Bearer', expires_in: ACCESS_TTL / 1000, refresh_token: refresh, scope }
}

/** Exchange an authorization code (single use, 5 minutes, PKCE-verified). */
export async function exchangeCode(
  db: D1Database,
  client: OAuthClient,
  input: { code: string, redirectUri: string, verifier: string, resource?: string },
): Promise<TokenPair> {
  const hash = await sha256(input.code)
  const row = await db
    .prepare('SELECT client_id, redirect_uri, code_challenge, scope, resource, expires_at, used FROM oauth_codes WHERE code_hash = ?')
    .bind(hash)
    .first<{ client_id: string, redirect_uri: string, code_challenge: string, scope: string, resource: string, expires_at: number, used: number }>()
  if (!row || row.client_id !== client.id) throw new OAuthError('invalid_grant', 'Unknown authorization code.')
  if (row.used) {
    // A replayed code: revoke everything issued from it (OAuth 2.1 §4.1.3).
    await db.prepare('UPDATE oauth_tokens SET revoked = 1 WHERE family = ?').bind(hash).run()
    throw new OAuthError('invalid_grant', 'Authorization code already used.')
  }
  await db.prepare('UPDATE oauth_codes SET used = 1 WHERE code_hash = ?').bind(hash).run()
  if (row.expires_at < Date.now()) throw new OAuthError('invalid_grant', 'Authorization code expired.')
  if (row.redirect_uri !== input.redirectUri) throw new OAuthError('invalid_grant', 'redirect_uri does not match.')
  if (row.code_challenge ? !(await verifyPkce(input.verifier, row.code_challenge)) : !client.secretHash) {
    throw new OAuthError('invalid_grant', 'PKCE verification failed.')
  }
  if (input.resource && !sameResource(input.resource, row.resource)) throw new OAuthError('invalid_target', 'Resource does not match the authorization.')
  return issueTokens(db, client.id, row.scope, row.resource, hash)
}

/** Rotate a refresh token. Reusing an old refresh token revokes its whole family. */
export async function refreshTokens(db: D1Database, client: OAuthClient, refreshToken: string): Promise<TokenPair> {
  const hash = await sha256(refreshToken)
  const row = await db
    .prepare('SELECT client_id, scope, resource, family, expires_at, revoked FROM oauth_tokens WHERE token_hash = ? AND kind = ?')
    .bind(hash, 'refresh')
    .first<{ client_id: string, scope: string, resource: string, family: string, expires_at: number, revoked: number }>()
  if (!row || row.client_id !== client.id) throw new OAuthError('invalid_grant', 'Unknown refresh token.')
  if (row.revoked) {
    await db.prepare('UPDATE oauth_tokens SET revoked = 1 WHERE family = ?').bind(row.family).run()
    throw new OAuthError('invalid_grant', 'Refresh token was already used or revoked.')
  }
  if (row.expires_at < Date.now()) throw new OAuthError('invalid_grant', 'Refresh token expired.')
  await db.prepare('UPDATE oauth_tokens SET revoked = 1 WHERE token_hash = ?').bind(hash).run()
  return issueTokens(db, client.id, row.scope, row.resource, row.family)
}

export async function revokeToken(db: D1Database, token: string) {
  const row = await db.prepare('SELECT family FROM oauth_tokens WHERE token_hash = ?').bind(await sha256(token)).first<{ family: string }>()
  if (row) await db.prepare('UPDATE oauth_tokens SET revoked = 1 WHERE family = ?').bind(row.family).run()
}

/** Validate a Bearer access token for the MCP endpoint. */
export async function verifyAccessToken(db: D1Database, resource: string, token: string): Promise<{ clientId: string, scope: string } | null> {
  if (!token || token.length > 200) return null
  const row = await db
    .prepare('SELECT client_id, scope, resource, expires_at, revoked FROM oauth_tokens WHERE token_hash = ? AND kind = ?')
    .bind(await sha256(token), 'access')
    .first<{ client_id: string, scope: string, resource: string, expires_at: number, revoked: number }>()
  if (!row || row.revoked || row.expires_at < Date.now() || !sameResource(row.resource, resource)) return null
  return { clientId: row.client_id, scope: row.scope }
}

/** Connections for the admin: one row per registered client, newest activity first. */
export async function listConnections(db: D1Database) {
  const { results } = await db
    .prepare(`SELECT c.id, c.name, c.created_at,
        MAX(t.created_at) AS last_used,
        SUM(CASE WHEN t.kind = 'refresh' AND t.revoked = 0 AND t.expires_at > ? THEN 1 ELSE 0 END) AS active
      FROM oauth_clients c LEFT JOIN oauth_tokens t ON t.client_id = c.id
      GROUP BY c.id ORDER BY COALESCE(MAX(t.created_at), c.created_at) DESC LIMIT 50`)
    .bind(Date.now())
    .all<{ id: string, name: string, created_at: number, last_used: number | null, active: number | null }>()
  return results.map((r) => ({ id: r.id, name: r.name, createdAt: r.created_at, lastUsed: r.last_used, active: (r.active || 0) > 0 }))
}

/** Disconnect a client: revoke its tokens and forget the registration. */
export async function removeClient(db: D1Database, id: string) {
  await db.batch([
    db.prepare('UPDATE oauth_tokens SET revoked = 1 WHERE client_id = ?').bind(id),
    db.prepare('DELETE FROM oauth_codes WHERE client_id = ?').bind(id),
    db.prepare('DELETE FROM oauth_clients WHERE id = ?').bind(id),
  ])
}

/** RFC 9728: where the MCP endpoint's tokens come from. */
export function protectedResourceMetadata(origin: string) {
  return {
    resource: `${origin}/mcp`,
    authorization_servers: [origin],
    scopes_supported: [OAUTH_SCOPE],
    bearer_methods_supported: ['header'],
    resource_name: 'Tomlop',
    resource_documentation: `${origin}/admin/integrations`,
  }
}

/** RFC 8414 authorization server metadata (also served as OpenID discovery for clients that look there). */
export function authorizationServerMetadata(origin: string) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/oauth/token`,
    registration_endpoint: `${origin}/oauth/register`,
    revocation_endpoint: `${origin}/oauth/revoke`,
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    revocation_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    scopes_supported: [OAUTH_SCOPE, 'offline_access'],
  }
}
