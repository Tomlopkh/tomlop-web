/**
 * tomlop-web: the public site (landing, privacy, download, reading library) and the
 * backoffice, on one Cloudflare Worker with a D1 database. The Android app syncs its
 * articles from /library/* (see docs/feed-schema.md); AI connectors write articles
 * through /mcp (see docs/MCP.md).
 */
export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  modules: ['nuxt-auth-utils', 'nitro-cloudflare-dev'],
  devtools: { enabled: false },

  app: {
    head: {
      htmlAttrs: { lang: 'km' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [
        { rel: 'icon', href: '/assets/favicon.svg', type: 'image/svg+xml' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@300;400;600&family=Noto+Serif+Khmer:wght@400;600&display=swap',
        },
        { rel: 'stylesheet', href: '/assets/style.css' },
      ],
    },
  },

  routeRules: {
    '/': { prerender: true },
    '/privacy': { prerender: true },
    '/download': { prerender: true },
    // The backoffice is a client-side app behind a sign-in; keep it out of search and caches.
    '/admin/**': { ssr: false, headers: { 'x-robots-tag': 'noindex', 'cache-control': 'no-store' } },
  },

  runtimeConfig: {
    // The canonical origin. OAuth tokens for AI connectors are bound to `${siteUrl}/mcp`.
    // NUXT_PUBLIC_SITE_URL=http://localhost:3000 for local development.
    public: { siteUrl: 'https://tomlop.chamrong.com' },
    // A single admin. NUXT_ADMIN_EMAIL, NUXT_ADMIN_PASSWORD_HASH (npm run hash-password)
    // and NUXT_SESSION_PASSWORD are Cloudflare secrets.
    adminEmail: '',
    adminPasswordHash: '',
    session: {
      name: 'tomlop-admin',
      password: '',
      maxAge: 60 * 60 * 12,
      cookie: { sameSite: 'lax', secure: true, httpOnly: true },
    },
  },

  nitro: {
    preset: process.env.NITRO_PRESET || 'cloudflare_module',
    cloudflare: { deployConfig: true, nodeCompat: true },
    prerender: { crawlLinks: false, failOnError: true, routes: ['/', '/privacy', '/download'] },
  },

  typescript: { strict: true },
})
