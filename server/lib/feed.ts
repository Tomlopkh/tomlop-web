import type { ArticleMeta } from './articles'

// Keep in lockstep with docs/feed-schema.md and the Android client (LibraryFeed.kt). A client
// that sees a higher schemaVersion, or has a versionCode below minAppVersionCode, ignores the
// feed and keeps its bundled articles.
export const SCHEMA_VERSION = 1
export const MIN_APP_VERSION_CODE = 2

export function buildLibraryIndex(rows: ArticleMeta[]) {
  // The newest edit, not "now": an unchanged feed stays byte-identical, so clients and
  // caches can tell that nothing changed.
  const generatedAt = rows.reduce((latest, r) => (r.updated_at > latest ? r.updated_at : latest), '1970-01-01T00:00:00Z')
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt,
    minAppVersionCode: MIN_APP_VERSION_CODE,
    articles: rows.map((r) => ({
      id: r.id,
      path: `articles/${r.id}.md`,
      titleEn: r.title_en,
      titleKm: r.title_km,
      readingMinutes: r.reading_minutes,
      bytes: r.bytes,
      sha256: r.sha256,
    })),
  }
}
