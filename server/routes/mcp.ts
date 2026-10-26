import { handleRpc, type JsonRpcRequest } from '../lib/mcp/server'
import { getClient, verifyAccessToken } from '../lib/oauth'

/**
 * MCP endpoint for AI connectors (Claude, ChatGPT): Streamable HTTP, stateless, JSON replies.
 * Requires an OAuth access token; without one the reply points the client at the OAuth
 * metadata so it can start the sign-in flow.
 */
export default defineEventHandler(async (event) => {
  setHeaders(event, {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, GET, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type, mcp-protocol-version, mcp-session-id',
    'access-control-expose-headers': 'www-authenticate, mcp-session-id',
    'cache-control': 'no-store',
  })
  if (event.method === 'OPTIONS') return null

  const db = useDb(event)
  const auth = getHeader(event, 'authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  const grant = token ? await verifyAccessToken(db, mcpResource(event), token) : null
  if (!grant) {
    const metadata = `${siteOrigin(event)}/.well-known/oauth-protected-resource/mcp`
    setHeader(event, 'www-authenticate', `Bearer realm="tomlop", resource_metadata="${metadata}"${token ? ', error="invalid_token"' : ''}`)
    setResponseStatus(event, 401)
    return { error: token ? 'invalid_token' : 'unauthorized', error_description: 'Connect this server through your AI app to sign in.' }
  }

  // No server-initiated stream: this server only answers requests.
  if (event.method === 'GET' || event.method === 'DELETE') {
    setHeader(event, 'allow', 'POST, OPTIONS')
    setResponseStatus(event, 405)
    return null
  }
  if (event.method !== 'POST') throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })

  let body: unknown
  try {
    body = await readBody(event)
  }
  catch {
    setResponseStatus(event, 400)
    return { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }
  }

  const client = await getClient(db, grant.clientId)
  const ctx = {
    db,
    clientName: (client?.name || 'AI connector').replace(/[^\w .-]/g, '').slice(0, 40),
    purge: (id: string) => purgeArticleCaches(event, id),
  }
  const messages = Array.isArray(body) ? body : [body]
  const replies = []
  for (const message of messages) {
    const reply = await handleRpc(message as JsonRpcRequest, ctx)
    if (reply) replies.push(reply)
  }
  if (!replies.length) {
    setResponseStatus(event, 202)
    return null
  }
  setHeader(event, 'content-type', 'application/json')
  return Array.isArray(body) ? replies : replies[0]
})
