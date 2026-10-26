import type { H3Event } from 'h3'

/** The D1 database bound as `DB` (see wrangler.jsonc). In `nuxt dev` it is a local SQLite copy. */
export function useDb(event: H3Event): D1Database {
  const env = (event.context.cloudflare as { env?: { DB?: D1Database } } | undefined)?.env
  if (!env?.DB) {
    throw createError({ statusCode: 503, statusMessage: 'Database not configured', message: 'The D1 database binding "DB" is missing.' })
  }
  return env.DB
}
