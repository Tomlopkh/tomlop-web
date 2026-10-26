import { checkAuthorizeRequest, issueCode, OAuthHttpError, redirectWith } from '../../../lib/oauth'

/** The admin's answer on the consent screen. Returns where to send the browser. */
export default defineEventHandler(async (event) => {
  const body = (await readBody(event).catch(() => ({}))) as { params?: Record<string, unknown>, approve?: boolean }
  const db = useDb(event)
  let checked
  try {
    checked = await checkAuthorizeRequest(db, mcpResource(event), body.params || {})
  }
  catch (error) {
    if (error instanceof OAuthHttpError) throw createError({ statusCode: error.status, statusMessage: 'Invalid authorization request', message: error.message })
    throw error
  }
  if ('redirectError' in checked) {
    const e = checked.redirectError
    return { redirect: redirectWith(e.redirectUri, { error: e.error, error_description: e.description, state: e.state }) }
  }
  const { request } = checked
  if (body.approve !== true) {
    return { redirect: redirectWith(request.redirectUri, { error: 'access_denied', error_description: 'The site owner declined the connection.', state: request.state }) }
  }
  const code = await issueCode(db, request)
  return { redirect: redirectWith(request.redirectUri, { code, state: request.state, iss: siteOrigin(event) }) }
})
