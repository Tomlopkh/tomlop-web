import { listArticles } from '../../lib/articles'
import { buildLibraryIndex } from '../../lib/feed'

/** The article feed the Android app syncs from (docs/feed-schema.md). */
export default defineEventHandler((event) =>
  edgeCached(event, 300, async () => ({
    body: JSON.stringify(buildLibraryIndex(await listArticles(useDb(event), true)), null, 2) + '\n',
    type: 'application/json; charset=utf-8',
  })),
)
