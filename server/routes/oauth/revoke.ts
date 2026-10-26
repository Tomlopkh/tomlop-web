import { revokeToken } from '../../lib/oauth'

/** RFC 7009 token revocation. Always 200, whether or not the token existed. */
export default defineEventHandler(async (event) => {
  oauthCors(event)
  if (event.method === 'OPTIONS') return null
  if (event.method !== 'POST') throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  const body = ((await readBody(event).catch(() => ({}))) || {}) as { token?: string }
  if (body.token) await revokeToken(useDb(event), body.token)
  setHeader(event, 'cache-control', 'no-store')
  return {}
})
