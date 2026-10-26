import { z } from 'zod'
import { saveArticle } from '../../../lib/articles'

const schema = z.object({ id: z.string().trim().max(100), markdown: z.string().max(200_000), published: z.boolean().default(false) })

export default defineEventHandler(async (event) => {
  const body = schema.safeParse(await readBody(event).catch(() => null))
  if (!body.success) throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
  const result = await saveArticle(useDb(event), body.data.id, body.data.markdown, body.data.published, 'create')
  if (!result.ok) throw createError({ statusCode: 422, statusMessage: 'Validation failed', message: result.error })
  await purgeArticleCaches(event, body.data.id)
  return { ok: true, warnings: result.warnings }
})
