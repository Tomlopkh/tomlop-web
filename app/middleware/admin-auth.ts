// Backoffice pages are a client-side app; the real protection is the session check on every
// /api/admin call (server/middleware/admin-guard.ts). This only sends a signed-out visitor to
// the sign-in page.
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, fetch } = useUserSession()
  if (!loggedIn.value) await fetch()
  if (!loggedIn.value) return navigateTo({ path: '/admin/login', query: { next: to.fullPath } })
})
