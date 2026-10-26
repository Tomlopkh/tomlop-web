import { getArticle } from '../../../lib/articles'

export default defineEventHandler(async (event) => {
  const row = await getArticle(useDb(event), getRouterParam(event, 'id') || '')
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  return { id: row.id, markdown: row.body, published: row.published === 1, readingMinutes: row.reading_minutes, updatedAt: row.updated_at }
})
