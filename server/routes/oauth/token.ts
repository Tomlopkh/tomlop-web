import { authenticateClient, exchangeCode, getClient, OAuthError, refreshTokens } from '../../lib/oauth'

/**
 * Token endpoint: authorization_code (PKCE; optional for confidential clients) and
 * refresh_token grants. Accepts form or JSON bodies, and client secrets via HTTP Basic or
 * the body for confidential clients.
 */
export default defineEventHandler(async (event) => {
  oauthCors(event)
  if (event.method === 'OPTIONS') return null
  if (event.method !== 'POST') throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  await rateLimit(event, 'oauth-token', 60, 10 * 60_000)
  setHeaders(event, { 'cache-control': 'no-store', 'pragma': 'no-cache' })

  const db = useDb(event)
  const body = ((await readBody(event).catch(() => ({}))) || {}) as Record<string, string | undefined>
  let clientId = body.client_id
  let clientSecret = body.client_secret
  const basic = getHeader(event, 'authorization')
  if (basic?.startsWith('Basic ')) {
    try {
      const [id, secret] = atob(basic.slice(6)).split(':').map(decodeURIComponent)
      clientId = id
      clientSecret = secret
    }
    catch {
      // fall through: invalid_client below
    }
  }

  const fail = (status: number, error: string, description: string) => {
    setResponseStatus(event, status)
    if (status === 401) setHeader(event, 'www-authenticate', 'Basic realm="oauth"')
    return { error, error_description: description }
  }
  const client = clientId ? await getClient(db, clientId) : null
  if (!client || !(await authenticateClient(client, clientSecret))) return fail(401, 'invalid_client', 'Unknown client or wrong secret.')

  try {
    if (body.grant_type === 'authorization_code') {
      // code_verifier is required whenever the authorization used PKCE (always, for public clients).
      if (!body.code || !body.redirect_uri || (!body.code_verifier && !client.secretHash)) {
        return fail(400, 'invalid_request', 'code, redirect_uri and code_verifier are required.')
      }
      return await exchangeCode(db, client, { code: body.code, redirectUri: body.redirect_uri, verifier: body.code_verifier || '', resource: body.resource })
    }
    if (body.grant_type === 'refresh_token') {
      if (!body.refresh_token) return fail(400, 'invalid_request', 'refresh_token is required.')
      return await refreshTokens(db, client, body.refresh_token)
    }
    return fail(400, 'unsupported_grant_type', 'Use authorization_code or refresh_token.')
  }
  catch (error) {
    if (error instanceof OAuthError) return fail(error.status, error.code, error.message)
    throw error
  }
})
