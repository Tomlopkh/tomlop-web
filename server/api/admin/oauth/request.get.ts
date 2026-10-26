import { checkAuthorizeRequest, OAuthHttpError } from '../../../lib/oauth'

/** What the consent screen shows: which connector asks, and where it will send you back. */
export default defineEventHandler(async (event) => {
  let checked
  try {
    checked = await checkAuthorizeRequest(useDb(event), mcpResource(event), getQuery(event))
  }
  catch (error) {
    if (error instanceof OAuthHttpError) throw createError({ statusCode: error.status, statusMessage: 'Invalid authorization request', message: error.message })
    throw error
  }
  if ('redirectError' in checked) throw createError({ statusCode: 400, statusMessage: checked.redirectError.error, message: checked.redirectError.description })
  return {
    client: { id: checked.client.id, name: checked.client.name },
    redirectHost: new URL(checked.request.redirectUri).host,
    scope: checked.request.scope,
    resource: checked.request.resource,
  }
})
