export interface InlineSegment { text: string, bold: boolean }

/**
 * The one inline style the article format has: `**bold**`. This mirrors parseMarkdownBold in
 * the Android app (TomlopApp.kt): split on "**" and treat every odd-numbered piece as bold,
 * so an unbalanced marker bolds to the end of the line in both places. Nothing is ever
 * interpreted as HTML; the pieces are rendered as text.
 */
export function splitBold(text: string): InlineSegment[] {
  return text
    .split('**')
    .map((piece, i) => ({ text: piece, bold: i % 2 === 1 }))
    .filter((segment) => segment.text.length > 0)
}
