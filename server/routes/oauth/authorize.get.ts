import { checkAuthorizeRequest, OAuthHttpError, redirectWith } from '../../lib/oauth'

/**
 * Authorization endpoint. Validates the request, then hands over to the consent screen at
 * /admin/connect (behind the admin sign-in). Problems that make the redirect URI untrustworthy
 * are shown here; the rest go back to the connector as `?error=`.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  let checked
  try {
    checked = await checkAuthorizeRequest(useDb(event), mcpResource(event), query)
  }
  catch (error) {
    if (error instanceof OAuthHttpError) throw createError({ statusCode: error.status, statusMessage: 'Invalid authorization request', message: error.message })
    throw error
  }
  if ('redirectError' in checked) {
    const e = checked.redirectError
    return sendRedirect(event, redirectWith(e.redirectUri, { error: e.error, error_description: e.description, state: e.state }), 302)
  }
  const params = new URLSearchParams()
  for (const key of ['client_id', 'redirect_uri', 'response_type', 'code_challenge', 'code_challenge_method', 'state', 'scope', 'resource']) {
    const value = query[key]
    if (typeof value === 'string') params.set(key, value)
  }
  return sendRedirect(event, `/admin/connect?${params}`, 302)
})
