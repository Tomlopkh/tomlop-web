import { listArticles, nextArticleId } from '../../../lib/articles'

export default defineEventHandler(async (event) => {
  const rows = await listArticles(useDb(event), false)
  return {
    suggestedNextId: nextArticleId(rows.map((r) => r.id)),
    articles: rows.map((r) => ({
      id: r.id,
      titleEn: r.title_en,
      titleKm: r.title_km,
      readingMinutes: r.reading_minutes,
      published: r.published === 1,
      updatedAt: r.updated_at,
    })),
  }
})
