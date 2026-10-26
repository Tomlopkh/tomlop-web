import { z } from 'zod'

const schema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  password: z.string().min(1).max(512),
})

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!config.adminEmail || !config.adminPasswordHash || !config.session?.password) {
    throw createError({ statusCode: 503, statusMessage: 'Admin not configured', message: 'Admin sign-in is not configured on this deployment.' })
  }
  await rateLimit(event, 'admin-login', 5, 15 * 60_000)
  const parsed = schema.safeParse(await readBody(event).catch(() => ({})))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid credentials', message: 'Enter your email and password.' })
  }
  const emailOk = safeEqual(parsed.data.email, config.adminEmail.trim().toLowerCase())
  // Always run the (slow) hash verification so the reply does not reveal which field was wrong.
  const passwordOk = await verifyPassword(config.adminPasswordHash, parsed.data.password).catch(() => false)
  if (!emailOk || !passwordOk) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials', message: 'Email or password is incorrect.' })
  }
  await setUserSession(event, { user: { email: parsed.data.email, role: 'admin' }, loggedInAt: Date.now() })
  return { ok: true }
})
