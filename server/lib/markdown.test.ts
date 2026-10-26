import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { validateArticle } from './articles'
import { ID_PATTERN, normalizeBody, parseArticle, sha256Hex } from './markdown'

const dir = new URL('../../library/articles/', import.meta.url)
const index = JSON.parse(readFileSync(new URL('../../library/library.json', import.meta.url), 'utf8')) as {
  articles: { id: string, titleEn: string, titleKm: string, readingMinutes: number, bytes: number, sha256: string }[]
}
const read = (id: string) => readFileSync(new URL(`${id}.md`, dir), 'utf8')

describe('the bundled corpus', () => {
  it('parses exactly as the Python generator and the Android app do', async () => {
    expect(index.articles).toHaveLength(86)
    for (const entry of index.articles) {
      const raw = read(entry.id)
      const parsed = parseArticle(entry.id, raw)
      expect(parsed, entry.id).not.toBeNull()
      expect(parsed!.titleEn, entry.id).toBe(entry.titleEn)
      expect(parsed!.titleKm, entry.id).toBe(entry.titleKm)
      expect(parsed!.minutes, entry.id).toBe(entry.readingMinutes)
      expect(new TextEncoder().encode(raw).length, entry.id).toBe(entry.bytes)
      expect(await sha256Hex(raw), entry.id).toBe(entry.sha256)
    }
  })

  it('has only valid ids', () => {
    for (const f of readdirSync(dir)) expect(f.replace(/\.md$/, '')).toMatch(ID_PATTERN)
  })

  it('validates with no warnings, so the checker never flags the house style', () => {
    // Every article uses **bold**; a checker that calls that "unsupported" is wrong.
    for (const entry of index.articles) {
      const checked = validateArticle(entry.id, read(entry.id))
      expect(checked.ok, entry.id).toBe(true)
      if (checked.ok) expect(checked.warnings, entry.id).toEqual([])
    }
  })
})

describe('parseArticle', () => {
  it('rejects markdown with no heading', () => {
    expect(parseArticle('87-x', 'just text')).toBeNull()
  })

  it('splits intro, sections and bullets', () => {
    const a = parseArticle('87-x', '# A / ខ\n\nintro\n\n## S\n\n- b\nplain\n')
    expect(a?.intro).toEqual(['intro'])
    expect(a?.sections).toEqual([{ title: 'S', lines: [{ text: 'b', bullet: true }, { text: 'plain', bullet: false }] }])
  })

  it('keeps ** markers in the text for the renderer to style', () => {
    const a = parseArticle('87-x', '# A / ខ\n\n## S\n\n- **key:** value\n')
    expect(a?.sections[0]!.lines[0]!.text).toBe('**key:** value')
  })
})

describe('validateArticle', () => {
  const ok = '# A / ខ្មែរ\n\nសួស្តី។\n\n## ផ្នែក\n\n- **ចំណុច៖** អត្ថន័យ\n'

  it('accepts a well-formed article', () => {
    expect(validateArticle('87-x-y', ok)).toMatchObject({ ok: true, warnings: [] })
  })

  it('rejects bad ids', () => {
    for (const id of ['Bad ID', '../x', '7-x', '87-', '87-A', '']) expect(validateArticle(id, ok).ok, id).toBe(false)
  })

  it('rejects a missing heading and empty content', () => {
    expect(validateArticle('87-x', 'no heading').ok).toBe(false)
    expect(validateArticle('87-x', '# A / ខ\n').ok).toBe(false)
  })

  it('warns about syntax the app and website would show literally', () => {
    const w = (line: string) => {
      const r = validateArticle('87-x', `# A / ខ្មែរ\n\nសួស្តី\n\n## S\n\n${line}\n`)
      return r.ok ? r.warnings : []
    }
    expect(w('### small heading')).toHaveLength(1)
    expect(w('1. numbered')).toHaveLength(1)
    expect(w('* star bullet')).toHaveLength(1)
    expect(w('> quote')).toHaveLength(1)
    expect(w('a [link](http://x) here')).toHaveLength(1)
    expect(w('<b>html</b>')).toHaveLength(1)
    expect(w('- **balanced** is fine')).toEqual([])
    expect(w('- **unbalanced is not')).toHaveLength(1)
  })

  it('warns when the Khmer title is missing', () => {
    const r = validateArticle('87-x', '# Only English\n\nសួស្តី\n')
    expect(r.ok && r.warnings.some((x) => x.includes('no Khmer title'))).toBe(true)
  })

  it('normalises line endings so the hash is stable', () => {
    expect(normalizeBody('# A\r\nx\r\n\r\n')).toBe('# A\nx\n')
  })
})
