<script setup lang="ts">
const { lang, setLang } = useLang()
</script>

<template>
  <div>
    <a class="skip" href="#main"><span class="km">ទៅកាន់ខ្លឹមសារ</span><span class="en">Skip to content</span></a>
    <div class="shell">
      <header class="masthead">
        <NuxtLink class="brand" to="/">
          <img src="/assets/mark.svg" alt="">
          <b>ទម្លាប់</b>
        </NuxtLink>
        <div class="langs" role="group" aria-label="Language">
          <button type="button" :aria-pressed="lang === 'km'" @click="setLang('km')">ខ្មែរ</button>
          <button type="button" :aria-pressed="lang === 'en'" @click="setLang('en')">English</button>
        </div>
      </header>
    </div>

    <main id="main">
      <slot />
    </main>

    <div class="shell">
      <footer class="foot">
        <nav>
          <NuxtLink to="/"><span class="km">ទំព័រដើម</span><span class="en">Home</span></NuxtLink>
          <NuxtLink to="/download"><span class="km">ទាញយក</span><span class="en">Download</span></NuxtLink>
          <NuxtLink to="/read/"><span class="km">បណ្ណាល័យ</span><span class="en">Library</span></NuxtLink>
          <NuxtLink to="/privacy"><span class="km">គោលការណ៍ឯកជនភាព</span><span class="en">Privacy policy</span></NuxtLink>
          <a href="https://github.com/Tomlopkh">GitHub</a>
        </nav>
        <p>
          <span class="km">ទម្លាប់ / Tomlop — បង្កើតឡើងនៅកម្ពុជា។</span>
          <span class="en">ទម្លាប់ / Tomlop — made in Cambodia.</span>
        </p>
      </footer>
    </div>
  </div>
</template>
