import type { H3Event } from 'h3'

/**
 * The feed is read by every phone once a day, so it is cached at the edge (Workers Cache API)
 * to keep D1 row reads low. The TTL is also the worst-case delay before an edit that was not
 * purged shows up. In `nuxt dev` there is no Cache API and rendering simply runs every time.
 */
function edgeCache(): Cache | undefined {
  return (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default
}

export interface Rendered { body: string, type: string, etag?: string }

export async function edgeCached(event: H3Event, ttl: number, render: () => Promise<Rendered | null>): Promise<string> {
  const cache = edgeCache()
  const key = new Request(getRequestURL(event).toString())
  const apply = (type: string, etag?: string | null) => {
    setHeader(event, 'content-type', type)
    setHeader(event, 'cache-control', `public, max-age=${ttl}`)
    if (etag) setHeader(event, 'etag', etag)
  }

  const hit = await cache?.match(key)
  if (hit) {
    apply(hit.headers.get('content-type') || 'text/plain; charset=utf-8', hit.headers.get('etag'))
    return hit.text()
  }

  const out = await render()
  if (!out) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  apply(out.type, out.etag)
  if (cache) {
    const headers: Record<string, string> = { 'content-type': out.type, 'cache-control': `public, max-age=${ttl}` }
    if (out.etag) headers.etag = out.etag
    const put = cache.put(key, new Response(out.body, { headers }))
    if (typeof event.waitUntil === 'function') event.waitUntil(put)
    else await put
  }
  return out.body
}

/** Forget this article's cached copies and the index. Clears the nearest data centre only; the rest expire within the TTL. */
export async function purgeArticleCaches(event: H3Event, id: string) {
  const cache = edgeCache()
  if (!cache) return
  const origin = getRequestURL(event).origin
  for (const path of ['/library/library.json', `/library/articles/${id}.md`]) {
    await cache.delete(new Request(`${origin}${path}`))
  }
}
