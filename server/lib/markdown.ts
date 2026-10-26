// The article format lives in shared/utils/article-format.ts so the backoffice runs the very same
// parser and validator in the browser. This module keeps the server-only piece (hashing) and
// re-exports the rest so existing imports keep working.
export { ID_PATTERN, normalizeBody, parseArticle, type ArticleLine, type ParsedArticle } from '../../shared/utils/article-format'

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
