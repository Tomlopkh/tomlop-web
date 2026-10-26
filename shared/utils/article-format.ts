/**
 * The article format, in one place for the server (saving, the feed, the AI connector) and the
 * browser (the backoffice's live preview and checks), so they can never disagree.
 *
 * It mirrors parseReadingArticle in the Android app (ReadingArticles.kt). Keep the two in step:
 * if one accepts syntax the other rejects, the same file renders differently per surface.
 * server/lib/markdown.test.ts checks titles, minutes, bytes and hashes of all 86 bundled
 * articles against library/library.json.
 */

export interface ArticleLine {
  text: string
  bullet: boolean
}

export interface ParsedArticle {
  id: string
  titleEn: string
  titleKm: string
  intro: string[]
  sections: { title: string, lines: ArticleLine[] }[]
  minutes: number
}

export function parseArticle(id: string, markdown: string): ParsedArticle | null {
  const lines = markdown.split(/\r?\n/)
  const headingIndex = lines.findIndex((l) => l.startsWith('# '))
  if (headingIndex < 0) return null

  const parts = lines[headingIndex]!.slice(2).split(' / ')
  const titleEn = parts[0]!.trim()
  const titleKm = parts.length > 1 ? parts.slice(1).join(' / ').trim() : titleEn

  const intro: string[] = []
  const sections: ParsedArticle['sections'] = []
  let title: string | null = null
  let current: ArticleLine[] = []

  const finish = () => {
    if (title !== null && current.length > 0) sections.push({ title, lines: current })
    current = []
  }

  for (const raw of lines.slice(headingIndex + 1)) {
    const line = raw.trim()
    if (line.startsWith('## ')) {
      finish()
      title = line.slice(3).trim()
    }
    else if (line.startsWith('- ')) {
      current.push({ text: line.slice(2).trim(), bullet: true })
    }
    else if (line && title === null) {
      intro.push(line)
    }
    else if (line) {
      current.push({ text: line, bullet: false })
    }
  }
  finish()

  const chars =
    intro.reduce((n, p) => n + p.length, 0) +
    sections.reduce((n, s) => n + s.lines.reduce((m, l) => m + l.text.length, 0), 0)
  return { id, titleEn, titleKm, intro, sections, minutes: Math.max(1, Math.floor(chars / 550) + 1) }
}

// Ids sort by their numeric prefix ("87-…" before "100-…"), so they double as the feed order.
// The shape is also the cache filename on the phone, so keep it strict.
export const ID_PATTERN = /^\d{2,3}-[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Bigger than any real article, far below the 256 KB the app will download. */
export const MAX_ARTICLE_BYTES = 100_000

export function normalizeBody(raw: string): string {
  return raw.replace(/\r\n?/g, '\n').trim() + '\n'
}

export type Validation =
  | { ok: true, body: string, parsed: ParsedArticle, warnings: string[] }
  | { ok: false, error: string }

const KHMER = /[ក-៿]/

/**
 * One validator for the backoffice form, the live checks and the AI connector. The format is
 * deliberately tiny (a heading, intro lines, `##` sections of lines and `- ` bullets, and
 * `**bold**`) because the same file is rendered by the Android app and the website; anything
 * else would show up as literal characters, so it is reported as a warning.
 */
export function validateArticle(id: string, markdown: string): Validation {
  if (!ID_PATTERN.test(id)) {
    return { ok: false, error: 'Id must look like 87-my-article: a number, then lowercase words joined by hyphens.' }
  }
  const body = normalizeBody(markdown)
  if (new TextEncoder().encode(body).length > MAX_ARTICLE_BYTES) {
    return { ok: false, error: `The article is larger than ${MAX_ARTICLE_BYTES / 1000} KB.` }
  }
  const parsed = parseArticle(id, body)
  if (!parsed) return { ok: false, error: 'The first line must be a heading: # English Title / ចំណងជើងខ្មែរ' }
  if (!parsed.intro.length && !parsed.sections.length) return { ok: false, error: 'The article has no content under its heading.' }

  const warnings: string[] = []
  if (parsed.titleKm === parsed.titleEn) warnings.push('The heading has no Khmer title. Use "# English Title / ចំណងជើងខ្មែរ".')
  else if (!KHMER.test(parsed.titleKm)) warnings.push('The part after " / " in the heading has no Khmer characters.')
  const bodyText = [...parsed.intro, ...parsed.sections.flatMap((s) => s.lines.map((l) => l.text))].join('\n')
  if (!KHMER.test(bodyText)) warnings.push('The article text has no Khmer characters; the library is Khmer-first.')
  if (!parsed.sections.length) warnings.push('There are no "## " sections, only an introduction.')

  for (const raw of body.split('\n')) {
    const line = raw.trim()
    if (/^#{3,}\s/.test(line)) warnings.push(`"${line.slice(0, 40)}": only "# " and "## " headings are supported; this shows as plain text.`)
    else if (/^\d+[.)]\s/.test(line)) warnings.push(`"${line.slice(0, 40)}": numbered lists are not supported; use "- " bullets.`)
    else if (/^[*+]\s/.test(line)) warnings.push(`"${line.slice(0, 40)}": bullets must start with "- ".`)
    else if (/^>/.test(line)) warnings.push(`"${line.slice(0, 40)}": quotes are not supported and show the ">" literally.`)
    else if (/__|`|\[[^\]]+\]\([^)]+\)|<\/?[a-z][^>]*>/i.test(line)) {
      warnings.push(`"${line.slice(0, 40)}": links, code, underscores and HTML are not supported and show as literal characters.`)
    }
    else if ((line.match(/\*\*/g) || []).length % 2 === 1) {
      warnings.push(`"${line.slice(0, 40)}": unbalanced ** marker; everything after it would turn bold.`)
    }
  }
  return { ok: true, body, parsed, warnings: [...new Set(warnings)].slice(0, 12) }
}

/** The next unused id: one past the highest number, so new articles continue the sequence. */
export function nextArticleId(existing: string[], slug = 'new-article'): string {
  const highest = existing.reduce((max, id) => Math.max(max, Number.parseInt(id, 10) || 0), 0)
  return `${String(highest + 1).padStart(2, '0')}-${slug}`
}
