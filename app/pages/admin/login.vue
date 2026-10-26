<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useHead({ title: 'Sign in' })

const route = useRoute()
const { fetch: refreshSession } = useUserSession()
const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')

// Only ever return to a backoffice page: never to another site.
const next = computed(() => {
  const target = String(route.query.next || '')
  return target.startsWith('/admin') && !target.startsWith('//') ? target : '/admin'
})

async function submit() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/admin/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await refreshSession()
    await navigateTo(next.value)
  }
  catch (e) {
    const status = (e as { statusCode?: number }).statusCode
    error.value = status === 429
      ? 'Too many attempts. Wait a few minutes, then try again.'
      : (e as { data?: { message?: string } }).data?.message || 'Could not sign in. Check your connection and try again.'
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="auth adm-narrow">
    <img class="auth-mark" src="/assets/mark.svg" alt="">
    <h1>Sign in</h1>
    <p class="lede">Write, publish and manage the Tomlop article library.</p>

    <div v-if="error" class="notice notice--error" role="alert" style="margin-top:1rem">
      <AdminIcon name="alert" /><span>{{ error }}</span>
    </div>

    <form @submit.prevent="submit">
      <div class="field">
        <label for="email">Email</label>
        <input id="email" v-model="email" type="email" autocomplete="username" required autofocus>
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input id="password" v-model="password" type="password" autocomplete="current-password" required>
      </div>
      <div class="actions">
        <button class="btn" :disabled="busy" :aria-busy="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
      </div>
    </form>
  </div>
</template>
