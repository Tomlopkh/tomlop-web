<script setup lang="ts">
useHead({
  link: [{ rel: 'stylesheet', href: '/assets/admin.css' }],
  meta: [{ name: 'robots', content: 'noindex' }],
  titleTemplate: (title) => (title ? `${title} — Tomlop admin` : 'Tomlop admin'),
})

const route = useRoute()
const { loggedIn, clear } = useUserSession()

const inArticles = computed(() => route.path === '/admin' || route.path.startsWith('/admin/articles'))
const inConnectors = computed(() => route.path.startsWith('/admin/integrations'))

async function signOut() {
  await $fetch('/api/admin/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/admin/login')
}
</script>

<template>
  <div class="adm">
    <a class="skip" href="#main"><span>Skip to content</span></a>
    <div class="shell">
      <header class="masthead">
        <NuxtLink class="brand" to="/admin">
          <img src="/assets/mark.svg" alt="">
          <b>ទម្លាប់ <small>Backoffice</small></b>
        </NuxtLink>
        <div v-if="loggedIn" class="adm-bar-end">
          <nav class="adm-nav" aria-label="Backoffice">
            <NuxtLink to="/admin" :data-active="inArticles" :aria-current="inArticles ? 'page' : undefined">Articles</NuxtLink>
            <NuxtLink to="/admin/integrations" :data-active="inConnectors" :aria-current="inConnectors ? 'page' : undefined">AI connectors</NuxtLink>
            <a class="only-wide" href="/read/" target="_blank" rel="noopener">View site</a>
          </nav>
          <button class="adm-signout" type="button" @click="signOut">Sign out</button>
        </div>
      </header>
    </div>
    <main id="main" class="shell adm-main">
      <slot />
    </main>
  </div>
</template>
