<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useHead({ title: 'Allow an AI app' })

// An AI app (Claude, ChatGPT) sent the owner here to approve a connection. The query string is
// the authorization request; the server re-validates it on both calls below.
const route = useRoute()
const query = computed(() => route.query as Record<string, string>)
const { data, error } = await useFetch<{ client: { name: string }, redirectHost: string, resource: string }>('/api/admin/oauth/request', { query: query.value })

const busy = ref<'allow' | 'deny' | null>(null)
const failure = ref('')

async function answer(approve: boolean) {
  busy.value = approve ? 'allow' : 'deny'
  failure.value = ''
  try {
    const { redirect } = await $fetch<{ redirect: string }>('/api/admin/oauth/approve', { method: 'POST', body: { params: query.value, approve } })
    await navigateTo(redirect, { external: true })
  }
  catch (e) {
    failure.value = (e as { data?: { message?: string } }).data?.message || 'Could not finish the connection. Start again from the AI app.'
    busy.value = null
  }
}
</script>

<template>
  <div class="auth adm-narrow">
    <img class="auth-mark" src="/assets/mark.svg" alt="">
    <h1>Allow an AI app?</h1>

    <div v-if="error" class="notice notice--error" role="alert" style="margin-top:1rem">
      <AdminIcon name="alert" />
      <span>{{ (error.data as { message?: string })?.message || 'This request is not valid.' }} Start the connection again from the AI app.</span>
    </div>

    <template v-else-if="data">
      <div class="who">
        <b>{{ data.client.name }}</b>
        <p>asks to connect to your Tomlop library. After you decide, you go back to <code>{{ data.redirectHost }}</code>.</p>
      </div>

      <h2 style="margin-top:1.5rem">If you allow it, it can</h2>
      <ul class="perms">
        <li><AdminIcon name="check" /><span>Read every article, including drafts</span></li>
        <li><AdminIcon name="check" /><span>Create, edit, publish, unpublish and delete articles</span></li>
        <li class="no"><AdminIcon name="x" /><span>Nothing else: it cannot see readers, devices or settings</span></li>
      </ul>
      <p class="soft" style="margin-top:.85rem;font-size:.9375rem">Only allow an app you just started connecting yourself. You can disconnect it any time under AI connectors.</p>

      <div v-if="failure" class="notice notice--error" role="alert" style="margin-top:1rem"><AdminIcon name="alert" /><span>{{ failure }}</span></div>

      <div class="actions">
        <button class="btn" type="button" :disabled="!!busy" :aria-busy="busy === 'allow'" @click="answer(true)">{{ busy === 'allow' ? 'Allowing…' : 'Allow' }}</button>
        <button class="btn btn--quiet" type="button" :disabled="!!busy" @click="answer(false)">Deny</button>
      </div>
    </template>
  </div>
</template>
