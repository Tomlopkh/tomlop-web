import { deleteArticle } from '../../../lib/articles'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || ''
  if (!(await deleteArticle(useDb(event), id))) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  await purgeArticleCaches(event, id)
  return { ok: true }
})
