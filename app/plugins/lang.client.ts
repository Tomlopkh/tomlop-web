// Restore the saved language after hydration, so the first client render matches the
// server-rendered (Khmer) HTML.
export default defineNuxtPlugin((nuxtApp) => {
  const { restoreLang } = useLang()
  nuxtApp.hook('app:mounted', restoreLang)
})
