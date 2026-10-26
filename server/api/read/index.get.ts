import { listArticles } from '../../lib/articles'

/** The published articles, for the website's library page. */
export default defineEventHandler(async (event) => {
  const rows = await listArticles(useDb(event), true)
  return rows.map((r) => ({ id: r.id, titleEn: r.title_en, titleKm: r.title_km, readingMinutes: r.reading_minutes }))
})
