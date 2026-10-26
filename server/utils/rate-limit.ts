import type { H3Event } from 'h3'

export function clientIp(event: H3Event): string {
  return getHeader(event, 'cf-connecting-ip') || getRequestIP(event, { xForwardedFor: true }) || 'unknown'
}

/**
 * Fixed-window counter per client address, kept in D1 so every Worker isolate shares it
 * (an in-memory map would give each isolate its own budget). One small write per call, so
 * it guards sign-in and OAuth, not every read.
 */
export async function rateLimit(event: H3Event, key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const row = await useDb(event)
    .prepare(`INSERT INTO rate_limits (id, count, reset_at) VALUES (?1, 1, ?2)
              ON CONFLICT(id) DO UPDATE SET
                count = CASE WHEN reset_at < ?3 THEN 1 ELSE count + 1 END,
                reset_at = CASE WHEN reset_at < ?3 THEN ?2 ELSE reset_at END
              RETURNING count, reset_at`)
    .bind(`${key}:${clientIp(event)}`, now + windowMs, now)
    .first<{ count: number, reset_at: number }>()
  if (row && row.count > limit) {
    setHeader(event, 'Retry-After', Math.max(1, Math.ceil((row.reset_at - now) / 1000)))
    throw createError({ statusCode: 429, statusMessage: 'Too many requests', message: 'Too many attempts. Please wait a few minutes and try again.' })
  }
}

/** Reject cross-site form posts: the Origin header must match the request host. */
export function assertSameOrigin(event: H3Event) {
  const origin = getHeader(event, 'origin')
  if (!origin) return // same-origin fetches from older browsers and non-browser clients
  const host = getHeader(event, 'x-forwarded-host') || getHeader(event, 'host')
  try {
    if (new URL(origin).host !== host) throw new Error('mismatch')
  }
  catch {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'Cross-origin request rejected.' })
  }
}
