<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useHead({ title: 'AI connectors' })

interface Connection { id: string, name: string, createdAt: number, lastUsed: number | null, active: boolean }
const { data, pending, error, refresh } = useFetch<{ mcpUrl: string, connections: Connection[] }>('/api/admin/oauth/connections', { lazy: true })

const url = computed(() => data.value?.mcpUrl ?? '')
const copied = ref(false)
async function copy() {
  try {
    await navigator.clipboard.writeText(url.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  }
  catch { /* clipboard blocked: the URL stays visible to copy by hand */ }
}

const idle = computed(() => (data.value?.connections ?? []).filter((c) => !c.active))
const clearing = ref(false)
async function clearIdle() {
  clearing.value = true
  failure.value = ''
  try {
    await Promise.all(idle.value.map((c) => $fetch(`/api/admin/oauth/connections/${c.id}`, { method: 'DELETE' })))
    await refresh()
  }
  catch {
    failure.value = 'Could not clear them all. Try again.'
  }
  finally {
    clearing.value = false
  }
}

function status(c: Connection) {
  if (c.active) return `Connected · last used ${timeAgo(c.lastUsed ?? c.createdAt)}`
  return c.lastUsed ? `Signed out · last used ${timeAgo(c.lastUsed)}` : `Never allowed · started ${timeAgo(c.createdAt)}`
}

const confirming = ref<string | null>(null)
const removing = ref(false)
const failure = ref('')
async function disconnect(c: Connection) {
  removing.value = true
  failure.value = ''
  try {
    await $fetch(`/api/admin/oauth/connections/${c.id}`, { method: 'DELETE' })
    confirming.value = null
    await refresh()
  }
  catch {
    failure.value = `Could not disconnect ${c.name}. Try again.`
  }
  finally {
    removing.value = false
  }
}
</script>

<template>
  <div class="adm-mid">
    <div class="page-head">
      <div>
        <h1>AI connectors</h1>
        <p class="meta soft" style="max-width:40rem">
          Connect Claude or ChatGPT and ask in plain words: <em>“Draft a short Khmer article on starting a habit in two minutes.”</em>
          It saves a draft; nothing goes public until you publish it.
        </p>
      </div>
    </div>

    <section class="section" aria-labelledby="url-h">
      <div class="section-head"><h2 id="url-h">Server address</h2></div>
      <div class="copybox" style="margin-top:0">
        <code class="num">{{ url || 'Loading…' }}</code>
        <button class="btn btn--quiet" type="button" :disabled="!url" @click="copy"><AdminIcon :name="copied ? 'check' : 'copy'" />{{ copied ? 'Copied' : 'Copy' }}</button>
      </div>
      <p class="muted" style="font-size:.875rem;margin-top:.5rem">Use this exact address. Access is tied to it.</p>
    </section>

    <section class="section" aria-labelledby="how-h">
      <div class="section-head"><h2 id="how-h">Connect an app</h2></div>
      <div class="how">
        <div>
          <h3>Claude</h3>
          <ol class="steps-list">
            <li>Settings → Connectors</li>
            <li>Add custom connector</li>
            <li>Paste the address, then Connect</li>
          </ol>
        </div>
        <div>
          <h3>ChatGPT</h3>
          <ol class="steps-list">
            <li>Settings → Apps &amp; Connectors → Advanced</li>
            <li>Turn on Developer mode, then Create</li>
            <li>Paste the address, choose OAuth</li>
            <li>In each chat, enable it from the + menu</li>
          </ol>
        </div>
        <div>
          <h3>Claude Code</h3>
          <p>Run this, then <code>/mcp</code> to sign in:</p>
          <pre><code>claude mcp add --transport http tomlop {{ url }}</code></pre>
        </div>
      </div>
      <p class="soft" style="margin-top:1rem;font-size:.9375rem">A window opens here asking you to allow the app. Sign in, check what it asks for, and press Allow.</p>
    </section>

    <section class="section" aria-labelledby="apps-h">
      <div class="section-head"><h2 id="apps-h">Connected apps</h2></div>

      <div v-if="failure" class="notice notice--error" role="alert"><AdminIcon name="alert" /><span>{{ failure }}</span></div>
      <div v-if="error" class="notice notice--error" role="alert">
        <AdminIcon name="alert" /><span>The connections could not be loaded. <button class="btn btn--quiet btn--small" type="button" style="margin-inline-start:.5rem" @click="refresh()">Try again</button></span>
      </div>
      <div v-else-if="pending && !data" class="conn-list" aria-busy="true"><div v-for="n in 2" :key="n" class="skel" /></div>
      <div v-else-if="!data?.connections.length" class="empty" style="padding-inline:0">
        <h3>Nothing connected yet</h3>
        <p>Once you connect an app it appears here, and you can disconnect it at any time. It stops working at once.</p>
      </div>
      <p v-if="idle.length" class="soft" style="font-size:.9375rem;margin-bottom:.5rem">
        {{ idle.length }} {{ idle.length === 1 ? 'entry was' : 'entries were' }} never completed or signed out. Each connection attempt leaves one behind.
        <button class="btn btn--quiet btn--small" type="button" style="margin-inline-start:.5rem" :disabled="clearing" @click="clearIdle">{{ clearing ? 'Clearing…' : 'Clear them' }}</button>
      </p>
      <div v-if="data?.connections.length" class="conn-list">
        <div v-for="c in data.connections" :key="c.id" class="conn" :class="{ 'conn--idle': !c.active }">
          <div>
            <b>{{ c.name }}</b>
            <small>{{ status(c) }}</small>
          </div>
          <button v-if="confirming !== c.id" class="btn btn--quiet btn--small" type="button" @click="confirming = c.id">Disconnect</button>
          <div v-else class="conn-confirm">
            <span>{{ c.name }} loses access immediately.</span>
            <button class="btn btn--danger-solid btn--small" type="button" :disabled="removing" @click="disconnect(c)">Disconnect</button>
            <button class="btn btn--quiet btn--small" type="button" @click="confirming = null">Keep</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
