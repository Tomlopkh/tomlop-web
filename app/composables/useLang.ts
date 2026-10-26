export type Lang = 'km' | 'en'

const STORED = 'tomlop.lang'

/** Khmer is the default; the choice is remembered in this browser only. */
export function useLang() {
  const lang = useState<Lang>('lang', () => 'km')

  function setLang(next: Lang) {
    lang.value = next
    try {
      localStorage.setItem(STORED, next)
    }
    catch { /* private mode */ }
  }

  function restoreLang() {
    try {
      const saved = localStorage.getItem(STORED)
      if (saved === 'km' || saved === 'en') lang.value = saved
    }
    catch { /* ignore */ }
  }

  return { lang, setLang, restoreLang }
}
