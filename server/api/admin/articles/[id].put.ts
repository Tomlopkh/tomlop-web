import { z } from 'zod'
import { saveArticle } from '../../../lib/articles'

const schema = z.object({ markdown: z.string().max(200_000), published: z.boolean() })

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || ''
  const body = schema.safeParse(await readBody(event).catch(() => null))
  if (!body.success) throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
  const result = await saveArticle(useDb(event), id, body.data.markdown, body.data.published, 'update')
  if (!result.ok) throw createError({ statusCode: 422, statusMessage: 'Validation failed', message: result.error })
  await purgeArticleCaches(event, id)
  return { ok: true, warnings: result.warnings }
})
