<script setup lang="ts">
useSeoMeta({
  title: 'ទម្លាប់ — Tomlop',
  description: 'ទម្លាប់ គឺជាកម្មវិធីកត់ត្រាទម្លាប់ប្រចាំថ្ងៃ ជាភាសាខ្មែរ។ មិនត្រូវការគណនី ហើយទិន្នន័យស្ថិតនៅក្នុងទូរស័ព្ទរបស់អ្នក។',
  ogTitle: 'ទម្លាប់ — Tomlop',
  ogDescription: 'Khmer-first, offline habit companion for Android. No account. Your data stays on your phone.',
  ogType: 'website',
})

const { lang } = useLang()

// The demonstration ledger: tapping a row is the one interaction the site shows off.
// pops re-keys the +XP chip so the reward animation replays on every check.
const rows = reactive([
  { km: 'ដើរ ១៥ នាទី', en: 'Walk 15 minutes', done: false, pops: 0 },
  { km: 'អានសៀវភៅ ១០ ទំព័រ', en: 'Read 10 pages', done: false, pops: 0 },
  { km: 'ផឹកទឹកឲ្យបានគ្រប់គ្រាន់', en: 'Drink enough water', done: true, pops: 0 },
])

function toggle(row: (typeof rows)[number]) {
  row.done = !row.done
  if (row.done) row.pops += 1
}

const doneCount = computed(() => rows.filter((r) => r.done).length)
const allDone = computed(() => doneCount.value === rows.length && rows.length > 0)

// Today's date is client-only, so a prerendered page never shows a stale date.
const now = ref<Date | null>(null)
onMounted(() => { now.value = new Date() })

const dateline = computed(() => {
  if (!now.value) return ''
  return lang.value === 'en'
    ? now.value.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : khDate(now.value)
})

// Deterministic confetti pieces — re-keyed per celebration so the burst replays.
const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 37) % 92 + 4}%`,
  color: ['var(--butter)', 'var(--coral)', 'var(--sky)', 'var(--lilac)', 'var(--moss)', 'var(--pink)'][i % 6],
  dur: `${1 + ((i * 13) % 40) / 60}s`,
  delay: `${((i * 7) % 20) / 100}s`,
  sway: `${((i * 11) % 30) - 15}px`,
  spin: `${240 + ((i * 17) % 300)}deg`,
}))

const celebrations = ref(0)
watch(allDone, (done) => { if (done) celebrations.value += 1 })

const tally = computed(() => {
  const done = doneCount.value
  const total = rows.length
  if (lang.value === 'en') {
    return done === total ? `<b>All ${total} done.</b> That is the whole app.` : `<b>${done} of ${total}</b> marked. Tap a row to try it.`
  }
  return done === total
    ? `<b>គ្រប់ ${kh(total)} រួចរាល់។</b> កម្មវិធីមានត្រឹមនេះឯង។`
    : `<b>${kh(done)} ក្នុងចំណោម ${kh(total)}</b> ត្រូវបានកត់ត្រា។ ចុចលើជួរណាមួយដើម្បីសាកល្បង។`
})
</script>

<template>
  <div class="shell">
    <section class="hero">
     <div class="hero-copy">
      <p class="kicker"><span class="km">គ្មានគណនី · ដំណើរការក្រៅបណ្ដាញ</span><span class="en">No account · Works offline</span></p>
      <h1>
        <span class="km">កត់ត្រាថ្ងៃនេះ ដោយចុចតែម្ដង</span>
        <span class="en">Mark today in one tap</span>
      </h1>

      <p class="hero-lede">
        <span class="km">ជ្រើសរើសសកម្មភាពតូចៗដែលអ្នកអាចធ្វើបានរាល់ថ្ងៃ។ ចុចមួយដងពេលធ្វើរួច ហើយមើលរូបត្លុកតូចៗរបស់អ្នករំភើបទៅតាមវឌ្ឍនភាព។ គ្មានគណនី គ្មានការតាមដាន។</span>
        <span class="en">Pick small actions you can repeat. Tap once when they are done, and watch your blobs react to your progress. No account, no tracking.</span>
      </p>

      <div class="actions">
        <NuxtLink class="btn" to="/download"><span class="km">ទាញយកកម្មវិធី</span><span class="en">Download the app</span></NuxtLink>
        <NuxtLink class="btn-ghost" to="/read/"><span class="km">សាកល្បងអាន</span><span class="en">Try the library</span></NuxtLink>
      </div>
      <ul class="chips">
        <li><span class="km">ទិន្នន័យនៅក្នុងទូរស័ព្ទ</span><span class="en">Data stays on the phone</span></li>
        <li><span class="km">៨៦ អត្ថបទខ្មែរ</span><span class="en">86 Khmer articles</span></li>
        <li>Android 8.0+</li>
      </ul>
     </div>

     <div class="today-page">
      <div class="mascot" aria-hidden="true">
        <svg v-if="allDone" viewBox="0 0 88 64" fill="none" stroke="#22223B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <ellipse cx="44" cy="38" rx="34" ry="22" fill="var(--moss)" />
          <path d="M28 36 Q32 28 36 36" />
          <path d="M52 36 Q56 28 60 36" />
          <path d="M33 42 Q44 54 55 42" />
          <circle cx="24" cy="43" r="3.5" fill="var(--pink)" stroke="none" opacity=".85" />
          <circle cx="64" cy="43" r="3.5" fill="var(--pink)" stroke="none" opacity=".85" />
        </svg>
        <svg v-else viewBox="0 0 88 64" fill="none" stroke="#22223B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <ellipse cx="44" cy="38" rx="34" ry="22" fill="var(--moss)" />
          <circle cx="32" cy="35" r="3" fill="#22223B" stroke="none" />
          <circle cx="56" cy="35" r="3" fill="#22223B" stroke="none" />
          <path d="M36 44 Q44 49 52 44" />
          <circle cx="25" cy="42" r="3.5" fill="var(--pink)" stroke="none" opacity=".85" />
          <circle cx="63" cy="42" r="3.5" fill="var(--pink)" stroke="none" opacity=".85" />
        </svg>
      </div>

      <p class="dateline"><span class="km">ថ្ងៃនេះ — {{ dateline }}</span><span class="en">Today — {{ dateline }}</span></p>
      <div v-if="allDone" class="confetti" :key="celebrations" aria-hidden="true">
        <i
          v-for="(piece, i) in CONFETTI"
          :key="i"
          :style="{ left: piece.left, background: piece.color, '--dur': piece.dur, '--delay': piece.delay, '--sway': piece.sway, '--spin': piece.spin }"
        />
      </div>
      <div class="ledger" role="group" aria-label="Demonstration">
        <button v-for="row in rows" :key="row.en" type="button" class="row" :aria-pressed="row.done" @click="toggle(row)">
          <span v-if="row.done && row.pops > 0" :key="row.pops" class="xp-pop" aria-hidden="true">+៥ XP</span>
          <span class="stamp" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#22223B" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.8 L9.4 18 L20 6.6" /></svg></span>
          <span class="row-label"><span class="km">{{ row.km }}</span><span class="en">{{ row.en }}</span></span>
          <span class="row-meta"><span class="km">រាល់ថ្ងៃ</span><span class="en">Daily</span></span>
        </button>
      </div>

      <p class="tally" v-html="tally" />
     </div>
    </section>
  </div>

  <div class="shell">
    <section class="band">
      <h2>
        <span class="km">អ្វីដែលកម្មវិធីនេះធ្វើ</span>
        <span class="en">What the app does</span>
      </h2>
      <dl class="entries">
        <div class="entry">
          <dt><span class="km">ថ្ងៃនេះ</span><span class="en">Today</span></dt>
          <dd><span class="km">បញ្ជីខ្លីនៃសកម្មភាពសម្រាប់ថ្ងៃនេះ។ ចុចមួយដងដើម្បីកត់ត្រា ហើយឃើញរូបត្លុកតូចៗរំភើបភ្លាមៗ។</span><span class="en">A short list of what today asks of you. One tap records it, and your blobs react right away.</span></dd>
        </div>
        <div class="entry">
          <dt><span class="km">គោលដៅ</span><span class="en">Goals</span></dt>
          <dd><span class="km">កំណត់ទិសដៅរយៈពេលវែងតាមវិស័យជីវិតទាំងប្រាំបី រួចបំបែកទៅជាចំណុចសម្គាល់តាមត្រីមាស។</span><span class="en">Set long-term direction across eight life dimensions, then break it into milestones by quarter and year.</span></dd>
        </div>
        <div class="entry">
          <dt><span class="km">វឌ្ឍនភាព</span><span class="en">Progress</span></dt>
          <dd><span class="km">ស្ថិតិប្រចាំសប្ដាហ៍ និងប្រតិទិនលម្អិត។ ខកខានមួយថ្ងៃ គឺជាព័ត៌មាន មិនមែនជាការបរាជ័យទេ។</span><span class="en">Weekly statistics and a detail calendar. Missing a day is information, not failure — the app never shames you for it.</span></dd>
        </div>
        <div class="entry">
          <dt><span class="km">ការរំលឹក</span><span class="en">Reminders</span></dt>
          <dd><span class="km">ការជូនដំណឹងក្នុងតំបន់ តាមពេលវេលាដែលអ្នកជ្រើសរើស។ គ្មានការជូនដំណឹងពីម៉ាស៊ីនមេទេ។</span><span class="en">Local notifications at times you choose. Nothing is pushed from a server, because there is no server.</span></dd>
        </div>
        <div class="entry">
          <dt><span class="km">បណ្ណាល័យ</span><span class="en">Library</span></dt>
          <dd><span class="km">អត្ថបទខ្លីៗចំនួន ៨៦ ជាភាសាខ្មែរ អំពីការគិត ទម្លាប់ និងការរស់នៅ។ អាចអានបានទោះគ្មានអ៊ីនធឺណិត ហើយនឹងទទួលអត្ថបទថ្មីៗនៅពេលមានអ៊ីនធឺណិត។</span><span class="en">Eighty-six short Khmer articles on thinking, habit and living. All readable with no connection, with new ones arriving when you are online.</span></dd>
        </div>
      </dl>
    </section>
  </div>

  <section class="pledge">
    <div class="shell">
      <h2>
        <span class="km">ទម្លាប់ និងកំណត់ត្រារបស់អ្នក មិនចេញពីទូរស័ព្ទទេ</span>
        <span class="en">Your habits and history never leave your phone</span>
      </h2>
      <p>
        <span class="km">នេះមិនមែនជាការសន្យាទេ — វាជារបៀបដែលកម្មវិធីត្រូវបានសាងសង់។ កម្មវិធីប្រើអ៊ីនធឺណិតតែដើម្បីទាញយកអត្ថបទថ្មីៗប៉ុណ្ណោះ ហើយមិនដែលបញ្ជូនទិន្នន័យរបស់អ្នកទេ។</span>
        <span class="en">This is not a promise about how we behave. It is how the app is built: it uses the internet only to download new articles, and never sends your data.</span>
      </p>
      <ul class="facts">
        <li><span class="km">គ្មានគណនី គ្មានការចុះឈ្មោះ</span><span class="en">No account, no sign-up</span></li>
        <li><span class="km">គ្មានការវិភាគ គ្មានការផ្សាយពាណិជ្ជកម្ម គ្មានឧបករណ៍តាមដាន</span><span class="en">No analytics, no ads, no third-party tracking SDKs</span></li>
        <li><span class="km">ទម្លាប់ គោលដៅ និងកំណត់ត្រា ស្ថិតនៅក្នុងទូរស័ព្ទតែប៉ុណ្ណោះ</span><span class="en">Habits, goals and history are stored only on the device</span></li>
        <li><span class="km">មូលដ្ឋានទិន្នន័យត្រូវបានដកចេញពីការបម្រុងទុកលើពពករបស់ Android</span><span class="en">The database is excluded from Android’s cloud backup</span></li>
        <li><span class="km">លុបកម្មវិធីចេញ គឺលុបទិន្នន័យទាំងអស់</span><span class="en">Uninstalling the app deletes all of it</span></li>
      </ul>
      <p><a href="/privacy"><span class="km">អានគោលការណ៍ឯកជនភាពទាំងស្រុង</span><span class="en">Read the full privacy policy</span></a></p>
    </div>
  </section>

  <div class="shell">
    <section class="band band--flush">
      <h2>
        <span class="km">បណ្ណាល័យអានក្រៅបណ្ដាញ</span>
        <span class="en">An offline reading library</span>
      </h2>
      <dl class="entries">
        <div class="entry">
          <dt><span class="km">៨៦ អត្ថបទ</span><span class="en">86 articles</span></dt>
          <dd><span class="km">សរសេរ និងកែសម្រួលជាភាសាខ្មែរ មិនមែនបកប្រែដោយម៉ាស៊ីនទេ។ អត្ថបទនីមួយៗមានរយៈពេលអានប្រហែលប្រាំនាទី។</span><span class="en">Written and proofread in Khmer, not machine-translated. Each runs about five minutes.</span></dd>
        </div>
        <div class="entry">
          <dt><span class="km">ជ្រើសរើសឲ្យខ្ញុំ</span><span class="en">Choose for me</span></dt>
          <dd><span class="km">ពេលមិនដឹងថាត្រូវអានអ្វី កម្មវិធីជ្រើសរើសអត្ថបទដែលអ្នកមិនទាន់អានជូន។</span><span class="en">When you do not know where to start, the app picks something you have not read yet.</span></dd>
        </div>
      </dl>
      <p style="margin-top:1.75rem"><a href="/read/"><span class="km">អានអត្ថបទទាំងអស់នៅទីនេះ</span><span class="en">Read all of them here</span></a></p>
    </section>
  </div>
</template>
