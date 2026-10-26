import { getArticle, listArticles } from '../../lib/articles'
import { parseArticle } from '../../lib/markdown'

/** One published article, parsed, with its neighbours for the previous/next links. */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || ''
  const db = useDb(event)
  const row = await getArticle(db, id)
  const article = row && row.published ? parseArticle(row.id, row.body) : null
  if (!article) throw createError({ statusCode: 404, statusMessage: 'Article not found' })

  const all = await listArticles(db, true)
  const at = all.findIndex((a) => a.id === id)
  const link = (a?: { id: string, title_km: string }) => (a ? { id: a.id, titleKm: a.title_km } : null)
  return {
    id: article.id,
    titleEn: article.titleEn,
    titleKm: article.titleKm,
    minutes: article.minutes,
    intro: article.intro,
    sections: article.sections,
    prev: link(all[at - 1]),
    next: link(all[at + 1]),
  }
})
