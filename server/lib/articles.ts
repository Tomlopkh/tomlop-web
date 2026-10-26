import { validateArticle } from '../../shared/utils/article-format'
import { sha256Hex } from './markdown'

export { MAX_ARTICLE_BYTES, nextArticleId, validateArticle } from '../../shared/utils/article-format'

export interface ArticleMeta {
  id: string
  title_en: string
  title_km: string
  reading_minutes: number
  bytes: number
  sha256: string
  published: number
  updated_at: string
}

export interface ArticleRow extends ArticleMeta {
  body: string
}

const META = 'id, title_en, title_km, reading_minutes, bytes, sha256, published, updated_at'
// Ids sort by their numeric prefix ("87-…" before "100-…"), so they double as the feed order.
const ORDER = 'ORDER BY CAST(id AS INTEGER), id'

export async function listArticles(db: D1Database, publishedOnly: boolean): Promise<ArticleMeta[]> {
  const where = publishedOnly ? 'WHERE published = 1' : ''
  const { results } = await db.prepare(`SELECT ${META} FROM articles ${where} ${ORDER}`).all<ArticleMeta>()
  return results
}

export function getArticle(db: D1Database, id: string): Promise<ArticleRow | null> {
  return db.prepare(`SELECT ${META}, body FROM articles WHERE id = ?`).bind(id).first<ArticleRow>()
}

export type SaveResult = { ok: true, warnings: string[] } | { ok: false, error: string }

export async function saveArticle(
  db: D1Database,
  id: string,
  markdown: string,
  published: boolean,
  mode: 'create' | 'update',
): Promise<SaveResult> {
  const checked = validateArticle(id, markdown)
  if (!checked.ok) return checked
  const { body, parsed } = checked
  const bytes = new TextEncoder().encode(body).length
  const hash = await sha256Hex(body)
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z')

  if (mode === 'create') {
    if (await db.prepare('SELECT 1 FROM articles WHERE id = ?').bind(id).first()) {
      return { ok: false, error: `An article with id ${id} already exists.` }
    }
    await db
      .prepare(`INSERT INTO articles (id, title_en, title_km, body, reading_minutes, bytes, sha256, published, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, parsed.titleEn, parsed.titleKm, body, parsed.minutes, bytes, hash, published ? 1 : 0, now)
      .run()
  }
  else {
    const result = await db
      .prepare(`UPDATE articles SET title_en = ?, title_km = ?, body = ?, reading_minutes = ?, bytes = ?, sha256 = ?,
                published = ?, updated_at = ? WHERE id = ?`)
      .bind(parsed.titleEn, parsed.titleKm, body, parsed.minutes, bytes, hash, published ? 1 : 0, now, id)
      .run()
    if (!result.meta.changes) return { ok: false, error: `No article with id ${id}.` }
  }
  return { ok: true, warnings: checked.warnings }
}

export async function setPublished(db: D1Database, id: string, published: boolean): Promise<boolean> {
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
  const result = await db.prepare('UPDATE articles SET published = ?, updated_at = ? WHERE id = ?').bind(published ? 1 : 0, now, id).run()
  return result.meta.changes > 0
}

export async function deleteArticle(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM articles WHERE id = ?').bind(id).run()
  return result.meta.changes > 0
}
