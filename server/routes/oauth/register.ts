import { z } from 'zod'
import { isAllowedRedirectUri, OAUTH_SCOPE, registerClient } from '../../lib/oauth'

/** RFC 7591 dynamic client registration: how Claude and ChatGPT connectors introduce themselves. */
const schema = z.object({
  redirect_uris: z.array(z.string().max(500)).min(1).max(10),
  client_name: z.string().trim().max(100).optional(),
  token_endpoint_auth_method: z.enum(['none', 'client_secret_post', 'client_secret_basic']).optional(),
  grant_types: z.array(z.string()).optional(),
  response_types: z.array(z.string()).optional(),
}).passthrough()

export default defineEventHandler(async (event) => {
  oauthCors(event)
  if (event.method === 'OPTIONS') return null
  if (event.method !== 'POST') throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  await rateLimit(event, 'oauth-register', 20, 60 * 60_000)
  setHeader(event, 'cache-control', 'no-store')

  const parsed = schema.safeParse(await readBody(event).catch(() => null))
  if (!parsed.success) {
    setResponseStatus(event, 400)
    return { error: 'invalid_client_metadata', error_description: 'redirect_uris is required.' }
  }
  const input = parsed.data
  const bad = input.redirect_uris.find((u) => !isAllowedRedirectUri(u))
  if (bad) {
    setResponseStatus(event, 400)
    return { error: 'invalid_redirect_uri', error_description: `Redirect URIs must be HTTPS (or http://localhost): ${bad}` }
  }
  const unsupported = (input.grant_types || []).filter((g) => !['authorization_code', 'refresh_token'].includes(g))
  if (unsupported.length) {
    setResponseStatus(event, 400)
    return { error: 'invalid_client_metadata', error_description: `Unsupported grant types: ${unsupported.join(', ')}` }
  }
  const method = input.token_endpoint_auth_method || 'none'
  const name = input.client_name || 'AI connector'
  const { id, secret } = await registerClient(useDb(event), { name, redirectUris: input.redirect_uris, confidential: method !== 'none' })
  setResponseStatus(event, 201)
  return {
    client_id: id,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_name: name,
    redirect_uris: input.redirect_uris,
    token_endpoint_auth_method: method,
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    scope: OAUTH_SCOPE,
    ...(secret ? { client_secret: secret, client_secret_expires_at: 0 } : {}),
  }
})
