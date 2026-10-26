<script setup lang="ts">
const props = defineProps<{ mode: 'create' | 'update', id: string, markdown: string, published: boolean }>()

const id = ref(props.id)
const markdown = ref(props.markdown)
const published = ref(props.published)

// What was last saved, to know whether there is anything to lose.
const saved = reactive({ markdown: props.markdown, published: props.published })
const dirty = computed(() => markdown.value !== saved.markdown || published.value !== saved.published)

const busy = ref(false)
const error = ref('')
const savedAt = ref<number | null>(null)
const idTouched = ref(false)
const tab = ref<'write' | 'preview'>('write')
const confirmingDelete = ref(false)

// The same validator and parser the server runs, so what the checks say here is what saving will say.
const idError = computed(() => {
  if (props.mode === 'update') return ''
  if (!id.value.trim()) return 'Give the article a number and a name, like 87-small-habits.'
  return ID_PATTERN.test(id.value.trim()) ? '' : 'Use a number, then lowercase English words joined by hyphens: 87-small-habits.'
})
const checked = computed(() => validateArticle(props.mode === 'update' || !idError.value ? id.value.trim() : '99-preview', markdown.value))
const parsed = computed(() => (checked.value.ok ? checked.value.parsed : parseArticle('00-x', normalizeBody(markdown.value))))
const warnings = computed(() => (checked.value.ok ? checked.value.warnings : []))
const problem = computed(() => (checked.value.ok ? '' : checked.value.error))
const bytes = computed(() => new TextEncoder().encode(markdown.value).length)

const apiError = (e: unknown) => (e as { data?: { message?: string } }).data?.message || 'Could not reach the server. Check your connection and try again.'

async function save() {
  if (busy.value) return
  idTouched.value = true
  if (idError.value) return
  busy.value = true
  error.value = ''
  try {
    const body = props.mode === 'create'
      ? { id: id.value.trim(), markdown: markdown.value, published: published.value }
      : { markdown: markdown.value, published: published.value }
    const url = props.mode === 'create' ? '/api/admin/articles' : `/api/admin/articles/${props.id}`
    await $fetch(url, { method: props.mode === 'create' ? 'POST' : 'PUT', body })
    saved.markdown = markdown.value
    saved.published = published.value
    savedAt.value = Date.now()
    if (props.mode === 'create') await navigateTo(`/admin/articles/${id.value.trim()}`)
  }
  catch (e) {
    error.value = apiError(e)
  }
  finally {
    busy.value = false
  }
}

async function remove() {
  busy.value = true
  error.value = ''
  try {
    await $fetch(`/api/admin/articles/${props.id}`, { method: 'DELETE' })
    saved.markdown = markdown.value
    saved.published = published.value
    await navigateTo('/admin')
  }
  catch (e) {
    error.value = apiError(e)
    busy.value = false
  }
}

function onKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    save()
  }
}
function beforeUnload(e: BeforeUnloadEvent) {
  if (dirty.value) e.preventDefault()
}
onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('beforeunload', beforeUnload)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('beforeunload', beforeUnload)
})
onBeforeRouteLeave(() => {
  if (dirty.value && !confirm('You have unsaved changes. Leave without saving?')) return false
})

const stateText = computed(() => {
  if (busy.value) return 'Saving…'
  if (dirty.value) return 'Unsaved changes'
  if (savedAt.value) return 'Saved'
  return props.mode === 'create' ? 'Not saved yet' : 'No changes'
})
</script>

<template>
  <form novalidate @submit.prevent="save">
    <div class="editor-head">
      <div>
        <NuxtLink class="backlink" to="/admin"><AdminIcon name="arrow-left" />Articles</NuxtLink>
        <h1 style="margin-top:.5rem">
          {{ mode === 'create' ? 'New article' : id }}
          <span v-if="mode === 'update'" class="chip" :class="saved.published ? 'chip--live' : 'chip--draft'">{{ saved.published ? 'Published' : 'Draft' }}</span>
        </h1>
      </div>
      <div class="seg tab-only" role="group" aria-label="View">
        <button type="button" :aria-pressed="tab === 'write'" @click="tab = 'write'">Write</button>
        <button type="button" :aria-pressed="tab === 'preview'" @click="tab = 'preview'">Preview</button>
      </div>
    </div>

    <div v-if="error" class="notice notice--error" role="alert">
      <AdminIcon name="alert" /><span>{{ error }}</span>
    </div>

    <div v-if="mode === 'create'" class="idrow">
      <div class="field" style="margin-top:0">
        <label for="id">Number and name</label>
        <input id="id" v-model="id" type="text" placeholder="87-small-habits" autocomplete="off" spellcheck="false" :aria-invalid="idTouched && !!idError" aria-describedby="id-hint" @blur="idTouched = true">
        <p id="id-hint" class="hint" :class="{ 'hint--error': idTouched && idError }">
          {{ idTouched && idError ? idError : 'This is the file name on phones and it sets the order. It cannot change later.' }}
        </p>
      </div>
    </div>

    <div class="panes">
      <section class="pane" :data-hidden="tab !== 'write'" aria-label="Write">
        <div class="pane-head">
          <h2>Markdown</h2>
          <span v-if="problem" class="chip chip--error">Fix to save</span>
          <span v-else-if="warnings.length" class="chip chip--warn">{{ warnings.length }} to check</span>
          <span v-else class="chip chip--ok">Valid</span>
        </div>
        <label class="sr-only" for="markdown">Article Markdown</label>
        <textarea id="markdown" v-model="markdown" class="source" spellcheck="false" lang="km" />

        <div class="checks" aria-live="polite">
          <div v-if="problem" class="notice notice--error"><AdminIcon name="alert" /><span>{{ problem }}</span></div>
          <div v-else-if="warnings.length" class="notice notice--warn">
            <AdminIcon name="alert" />
            <div>Check before publishing
              <ul><li v-for="w in warnings" :key="w">{{ w }}</li></ul>
            </div>
          </div>
          <div v-else class="notice notice--ok"><AdminIcon name="check" /><span>The format is valid. No problems found.</span></div>
        </div>
        <p class="stats num">
          <span>{{ markdown.length.toLocaleString() }} characters</span>
          <span v-if="parsed">about {{ parsed.minutes }} min read</span>
          <span>{{ (bytes / 1000).toFixed(1) }} of 100 KB</span>
        </p>
      </section>

      <section class="pane" :data-hidden="tab !== 'preview'" aria-label="Preview">
        <div class="pane-head"><h2>Preview, as readers see it</h2></div>
        <div class="preview">
          <ArticleBody v-if="parsed" :article="parsed" />
          <div v-else class="empty">
            <h3>Nothing to preview yet</h3>
            <p>Start with a heading: <code># English Title / ចំណងជើងខ្មែរ</code></p>
          </div>
        </div>
      </section>
    </div>

    <div class="actionbar">
      <div>
        <label class="switch">
          <input v-model="published" type="checkbox" role="switch">
          <b>{{ published ? 'Published' : 'Draft' }}</b>
        </label>
        <p class="hint muted" style="font-size:.8125rem;margin-top:.15rem">{{ published ? 'Visible on the website, and delivered to phones on their next check.' : 'Only you can see it.' }}</p>
      </div>
      <div class="actionbar-end">
        <span class="state" :data-dirty="dirty" role="status">{{ stateText }}</span>
        <a v-if="mode === 'update' && saved.published" class="btn btn--quiet" :href="`/read/${id}/`" target="_blank" rel="noopener">View on site <AdminIcon name="external" /></a>
        <button class="btn" :disabled="busy || !!problem || (mode === 'create' && !!idError)" :aria-busy="busy">{{ busy ? 'Saving…' : mode === 'create' ? 'Create article' : 'Save changes' }}</button>
      </div>
    </div>

    <section v-if="mode === 'update'" class="danger-zone">
      <h2>Delete this article</h2>
      <p>Removes it from the website and the feed. Phones that already downloaded it keep their copy, and the 86 articles bundled in the app stay in the app.</p>
      <div class="actions">
        <button v-if="!confirmingDelete" type="button" class="btn btn--danger" @click="confirmingDelete = true"><AdminIcon name="trash" />Delete article</button>
        <template v-else>
          <button type="button" class="btn btn--danger-solid" :disabled="busy" @click="remove">Delete {{ id }} permanently</button>
          <button type="button" class="btn btn--quiet" @click="confirmingDelete = false">Keep it</button>
        </template>
      </div>
    </section>
  </form>
</template>
