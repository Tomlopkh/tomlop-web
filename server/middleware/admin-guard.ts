/**
 * Protects every admin API route. Authentication is a sealed, HttpOnly session cookie, never
 * a hidden URL. Mutating requests must also come from the same origin (a CSRF guard on top
 * of SameSite=Lax cookies).
 */
const PUBLIC_ADMIN_ROUTES = new Set(['/api/admin/auth/login'])

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/admin')) return
  if (event.method !== 'GET' && event.method !== 'HEAD') assertSameOrigin(event)
  if (PUBLIC_ADMIN_ROUTES.has(path)) return
  if (!useRuntimeConfig(event).session?.password) {
    throw createError({ statusCode: 503, statusMessage: 'Admin not configured', message: 'Admin sign-in is not configured on this deployment.' })
  }
  await requireAdmin(event)
})
