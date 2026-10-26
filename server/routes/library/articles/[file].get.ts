import { getArticle } from '../../../lib/articles'

/** One published article's Markdown, byte-identical to what its sha256 in the feed covers. */
export default defineEventHandler((event) => {
  const file = getRouterParam(event, 'file') || ''
  const match = /^([a-z0-9-]+)\.md$/.exec(file)
  if (!match) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  return edgeCached(event, 300, async () => {
    const row = await getArticle(useDb(event), match[1]!)
    if (!row || !row.published) return null
    return { body: row.body, type: 'text/markdown; charset=utf-8', etag: `"${row.sha256}"` }
  })
})
