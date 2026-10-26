<script setup lang="ts">
import type { ArticleRow } from '~/components/AdminArticleRow.vue'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useHead({ title: 'Articles' })

const { data, pending, error, refresh } = useFetch<{ suggestedNextId: string, articles: ArticleRow[] }>('/api/admin/articles', { lazy: true })
// The connector status is a nicety: a failure here must not break the page.
const { data: connectors } = useFetch<{ mcpUrl: string, connections: { name: string, active: boolean, lastUsed: number | null, createdAt: number }[] }>(
  '/api/admin/oauth/connections', { lazy: true },
)

const articles = computed(() => data.value?.articles ?? [])
const drafts = computed(() => articles.value.filter((a) => !a.published).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
const published = computed(() => articles.value.filter((a) => a.published))
const lastEdit = computed(() => articles.value.reduce((latest, a) => (a.updatedAt > latest ? a.updatedAt : latest), ''))

const query = ref('')
const filter = ref<'all' | 'published' | 'drafts'>('all')
const order = ref<'library' | 'recent'>('library')

const searching = computed(() => query.value.trim() !== '' || filter.value !== 'all')

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  let rows = articles.value.filter((a) => {
    if (filter.value === 'published' && !a.published) return false
    if (filter.value === 'drafts' && a.published) return false
    return !q || a.id.includes(q) || a.titleEn.toLowerCase().includes(q) || a.titleKm.includes(q)
  })
  if (order.value === 'recent') rows = [...rows].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return rows
})

function clearSearch() {
  query.value = ''
  filter.value = 'all'
}

const feedUrl = computed(() => (import.meta.client ? `${location.origin}/library/library.json` : ''))
const copied = ref(false)
async function copyFeed() {
  try {
    await navigator.clipboard.writeText(feedUrl.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
  catch { /* clipboard blocked: the URL stays visible to copy by hand */ }
}

const active = computed(() => (connectors.value?.connections ?? []).filter((c) => c.active))
const lastConnectorUse = computed(() => Math.max(0, ...active.value.map((c) => c.lastUsed ?? c.createdAt)))
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Articles</h1>
        <p v-if="articles.length" class="meta muted num">
          {{ published.length }} published · {{ drafts.length }} {{ drafts.length === 1 ? 'draft' : 'drafts' }} · last edit {{ timeAgo(lastEdit) }}
        </p>
      </div>
      <NuxtLink class="btn" to="/admin/articles/new"><AdminIcon name="plus" />New article</NuxtLink>
    </div>

    <div class="dash">
      <div>
        <div v-if="error" class="notice notice--error" role="alert">
          <AdminIcon name="alert" />
          <span>The articles could not be loaded. <button class="btn btn--quiet btn--small" type="button" style="margin-inline-start:.5rem" @click="refresh()">Try again</button></span>
        </div>

        <template v-else>
          <div class="tools">
            <div class="search">
              <AdminIcon name="search" />
              <input v-model="query" type="search" placeholder="Search by title or number" aria-label="Search articles" autocomplete="off">
            </div>
            <div class="seg" role="group" aria-label="Show">
              <button type="button" :aria-pressed="filter === 'all'" @click="filter = 'all'">All <span class="num">{{ articles.length }}</span></button>
              <button type="button" :aria-pressed="filter === 'published'" @click="filter = 'published'">Published <span class="num">{{ published.length }}</span></button>
              <button type="button" :aria-pressed="filter === 'drafts'" @click="filter = 'drafts'">Drafts <span class="num">{{ drafts.length }}</span></button>
            </div>
          </div>

          <div v-if="pending && !articles.length" aria-busy="true" aria-label="Loading articles">
            <div class="rows"><div v-for="n in 7" :key="n" class="skel" /></div>
          </div>

          <!-- Default view: what needs you (drafts) first, then the library. -->
          <template v-else-if="!searching">
            <section v-if="drafts.length" class="section" aria-labelledby="drafts-h">
              <div class="section-head"><h2 id="drafts-h">Drafts <span class="muted num" style="font-family:var(--sans);font-weight:400">{{ drafts.length }}</span></h2></div>
              <ul class="rows"><AdminArticleRow v-for="a in drafts" :key="a.id" :article="a" /></ul>
            </section>
            <section v-else class="section">
              <div class="empty" style="padding-top:0">
                <h3>No drafts waiting</h3>
                <p>Everything written is published. Start the next article yourself, or ask Claude or ChatGPT to draft one.</p>
                <p class="actions" style="display:flex;gap:.5rem;flex-wrap:wrap">
                  <NuxtLink class="btn btn--quiet btn--small" to="/admin/articles/new">Write an article</NuxtLink>
                  <NuxtLink class="btn btn--quiet btn--small" to="/admin/integrations">Set up an AI connector</NuxtLink>
                </p>
              </div>
            </section>

            <section class="section" aria-labelledby="pub-h">
              <div class="section-head">
                <h2 id="pub-h">Published <span class="muted num" style="font-family:var(--sans);font-weight:400">{{ published.length }}</span></h2>
                <label class="sr-only" for="order-pub">Order</label>
                <select id="order-pub" v-model="order" class="order"><option value="library">Library order</option><option value="recent">Recently edited</option></select>
              </div>
              <ul class="rows">
                <AdminArticleRow v-for="a in (order === 'recent' ? [...published].sort((x, y) => y.updatedAt.localeCompare(x.updatedAt)) : published)" :key="a.id" :article="a" />
              </ul>
            </section>
          </template>

          <!-- Searching or filtering: one flat list, status shown on every row. -->
          <section v-else class="section" aria-live="polite">
            <div class="section-head">
              <h2>Results <span class="muted num" style="font-family:var(--sans);font-weight:400">{{ results.length }}</span></h2>
              <label class="sr-only" for="order-res">Order</label>
              <select id="order-res" v-model="order" class="order"><option value="library">Library order</option><option value="recent">Recently edited</option></select>
            </div>
            <ul v-if="results.length" class="rows"><AdminArticleRow v-for="a in results" :key="a.id" :article="a" show-status /></ul>
            <div v-else class="empty">
              <h3>Nothing matches</h3>
              <p>No article has “{{ query }}” in its title or number<template v-if="filter !== 'all'"> among {{ filter }}</template>.</p>
              <p class="actions"><button class="btn btn--quiet btn--small" type="button" @click="clearSearch">Clear search</button></p>
            </div>
          </section>
        </template>
      </div>

      <aside aria-label="Connections">
        <section class="aside-block">
          <h2>AI connectors</h2>
          <template v-if="active.length">
            <p>{{ active.length }} {{ active.length === 1 ? 'app' : 'apps' }} connected<template v-if="lastConnectorUse"> · last used {{ timeAgo(lastConnectorUse) }}</template>.</p>
            <p class="actions"><NuxtLink class="btn btn--quiet btn--small" to="/admin/integrations">Manage</NuxtLink></p>
          </template>
          <template v-else>
            <p>Draft articles by chatting with Claude or ChatGPT. You approve each connection and publish nothing you have not read.</p>
            <p class="actions"><NuxtLink class="btn btn--quiet btn--small" to="/admin/integrations">Set up</NuxtLink></p>
          </template>
        </section>
        <section class="aside-block">
          <h2>What phones receive</h2>
          <p>Published articles reach the app within a day of an edit, and the website within minutes. Drafts reach no one.</p>
          <div class="copybox">
            <code>/library/library.json</code>
            <button class="btn btn--quiet btn--small" type="button" :aria-label="copied ? 'Full feed address copied' : 'Copy the full feed address'" @click="copyFeed">
              <AdminIcon :name="copied ? 'check' : 'copy'" />
            </button>
          </div>
          <p class="actions"><a class="btn btn--quiet btn--small" href="/read/" target="_blank" rel="noopener">Open public library <AdminIcon name="external" /></a></p>
        </section>
      </aside>
    </div>
  </div>
</template>
