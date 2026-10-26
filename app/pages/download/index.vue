<script setup lang="ts">
interface Release { released: boolean, version: string, apkUrl: string, bytes: number, sha256: string, minAndroid: string }

useSeoMeta({
  title: 'ទាញយក — ទម្លាប់',
  description: 'ទាញយកកម្មវិធី ទម្លាប់ សម្រាប់ Android។ Download the Tomlop Android app.',
})

const { lang } = useLang()
const release = ref<Release | null>(null)
const megabytes = computed(() => ((release.value?.bytes ?? 0) / 1048576).toFixed(1))

// A static file, not an API: same origin, no rate limit, and the page keeps its not-yet
// state if the fetch fails.
onMounted(async () => {
  try {
    const data = await $fetch<Release>('/download.json', { headers: { 'cache-control': 'no-cache' } })
    if (data?.released && data.apkUrl) release.value = data
  }
  catch { /* leave the not-yet state in place */ }
})
</script>

<template>
<div class="shell">
<section class="band band--flush download">

  <h1><span class="km">ទាញយកកម្មវិធី</span><span class="en">Download</span></h1>
  <p class="hero-lede">
    <span class="km">ទម្លាប់ ដំណើរការលើ Android ៨.០ ឡើងទៅ។ ទំហំតូច ហើយដំណើរការបានពេញលេញ ទោះគ្មានអ៊ីនធឺណិត។</span>
    <span class="en">Tomlop runs on Android 8.0 and above. It is small, and fully usable with no connection.</span>
  </p>

  <!-- Populated from /download.json. The pending state shows until a release exists. -->
  <div v-if="release" class="release-ready">
    <a class="btn" :href="release.apkUrl">
      <span v-if="lang === 'en'">Download {{ release.version }}</span>
      <span v-else>ទាញយក {{ release.version }}</span>
    </a>
    <p class="aside-note">
      <template v-if="lang === 'en'">{{ megabytes }} MB · Android {{ release.minAndroid }} and above</template>
      <template v-else>{{ megabytes }} MB · Android {{ release.minAndroid }} ឡើងទៅ</template>
    </p>
    <p class="hash"><span>SHA-256</span><code>{{ release.sha256 }}</code></p>
  </div>
  <div v-else class="release-pending">
    <p class="soon"><span class="km">មិនទាន់មានការចេញផ្សាយនៅឡើយទេ</span><span class="en">No release yet</span></p>
    <p class="aside-note">
      <span class="km">កម្មវិធីកំពុងរៀបចំសម្រាប់ Google Play។ ទំព័រនេះនឹងបង្ហាញតំណទាញយក ពេលមានការចេញផ្សាយដំបូង។</span>
      <span class="en">The app is being prepared for Google Play. This page will show a download link once the first build is published.</span>
    </p>
  </div>

  <h2><span class="km">របៀបដំឡើង</span><span class="en">How to install</span></h2>
  <ol class="steps">
    <li><span class="km">ទាញយកឯកសារ <code>.apk</code> ខាងលើ។</span><span class="en">Download the <code>.apk</code> above.</span></li>
    <li><span class="km">បើកឯកសារនោះ។ Android នឹងសួរថាតើអនុញ្ញាតឲ្យដំឡើងពីប្រភពនេះដែរឬទេ — សូមចុច <strong>អនុញ្ញាត</strong> រួចបន្ត។</span><span class="en">Open it. Android will ask whether to allow installs from this source — choose <strong>allow</strong>, then continue.</span></li>
    <li><span class="km">ប្រសិនបើអ្នកធ្លាប់ដំឡើង <strong>1.0.0</strong> កំណែនេះចុះហត្ថលេខាដោយសោថ្មី ដូច្នេះ Android មិនអាចដំឡើងពីលើបានទេ៖ សូមលុប 1.0.0 ចេញជាមុន (ទិន្នន័យក្នុងកម្មវិធីចាស់នឹងបាត់) រួចដំឡើងកំណែនេះ។ បើអ្នកមិនធ្លាប់ដំឡើង 1.0.0 ទេ គ្មានអ្វីត្រូវធ្វើបន្ថែម។</span><span class="en">If you installed <strong>1.0.0</strong>, this build is signed with a new key, so Android cannot install it over the old one: uninstall 1.0.0 first (its in-app data is lost), then install this. If you never installed 1.0.0, there is nothing extra to do.</span></li>
  </ol>

  <h2><span class="km">ផ្ទៀងផ្ទាត់ឯកសារ</span><span class="en">Verify the file</span></h2>
  <p>
    <span class="km">ការដំឡើងឯកសារ <code>.apk</code> ពីអ៊ីនធឺណិត ជាទូទៅមានហានិភ័យ។ សូមប្រៀបធៀបលេខកូដ SHA-256 របស់ឯកសារដែលអ្នកទាញយក ជាមួយលេខដែលបង្ហាញខាងលើ។ បើវាខុសគ្នា សូមកុំដំឡើង។</span>
    <span class="en">Installing an <code>.apk</code> from the internet is generally risky. Compare the SHA-256 of the file you downloaded with the one shown above. If they differ, do not install it.</span>
  </p>
<pre class="cmd"><code>shasum -a 256 tomlop-&lt;version&gt;.apk</code></pre>
  <p>
    <span class="km">នៅពេលកម្មវិធីមាននៅលើ Google Play រួចហើយ សូមប្រើ Play វិញ។ Play ធ្វើការផ្ទៀងផ្ទាត់ និងធ្វើបច្ចុប្បន្នភាពដោយស្វ័យប្រវត្តិជូនអ្នក។</span>
    <span class="en">Once the app is on Google Play, prefer Play. It verifies the build and updates it for you.</span>
  </p>

  <h2><span class="km">អ្វីដែលកម្មវិធីនេះមិនធ្វើ</span><span class="en">What it does not do</span></h2>
  <p>
    <span class="km">មិនត្រូវការគណនី គ្មានការវិភាគ គ្មានការផ្សាយពាណិជ្ជកម្ម។ សិទ្ធិ <code>INTERNET</code> ត្រូវបានប្រើតែដើម្បីទាញយកអត្ថបទថ្មីៗប៉ុណ្ណោះ។ សូមអាន<a href="/privacy">គោលការណ៍ឯកជនភាព</a>សម្រាប់ព័ត៌មានពេញលេញ។</span>
    <span class="en">No account, no analytics, no ads. The <code>INTERNET</code> permission is used only to download new articles. See the <a href="/privacy">privacy policy</a> for the full account.</span>
  </p>

</section>
</div>
</template>
