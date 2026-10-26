export const SHORT_INSTRUCTIONS =
  'Tomlop (ទម្លាប់) is a Khmer-first habit app with a library of short Khmer articles. Call get_platform_guide first: it explains the article format, limits and workflow. Articles are saved as drafts; publish only when the owner says so.'

export function platformGuide(): string {
  return `# Tomlop article guide

Tomlop is an offline Khmer habit app for Android. Its **library** is a set of short Khmer
articles on thinking, habit and living. The first 86 ship inside the app; new and corrected
ones are delivered from this site when the phone is online. You write the new ones here.

## How an article reaches readers

1. You save it (a **draft** by default; drafts are visible to nobody but the owner).
2. The owner says "publish", and you call publish_article.
3. Phones fetch the feed (library.json) at most once a day and download the new article;
   the website shows it at /read/<id>/ within seconds.

Because the same file is shown by the Android app and the website, the format is tiny and strict.

## The format (nothing else is supported)

\`\`\`markdown
# English Title / ចំណងជើងខ្មែរ

An introduction paragraph. One paragraph per line.
A second intro paragraph, on its own line.

## Section heading

- a bullet
a plain paragraph
- another bullet
\`\`\`

- **First line:** \`# English Title / ចំណងជើងខ្មែរ\`. English, then " / ", then the Khmer title.
- **Introduction:** every non-empty line before the first \`##\` is one paragraph.
- **Sections:** \`## Heading\`, then lines. A line starting with \`- \` is a bullet; any other line is a paragraph.
- **Inline:** only \`**bold**\` is supported. The existing articles use it to lead a bullet with its key phrase, e.g. \`- **Ask directly:** if in doubt, ask.\` Keep the markers balanced.
- **Not supported** (they show up as literal characters): \`###\` headings, numbered lists, *italic*, links, images, code, quotes, tables, HTML.
- Blank lines are ignored. Keep each paragraph to one line.

## Ids

An id looks like \`87-my-article\`: a number, then lowercase English words joined by hyphens.
It is permanent (it is the filename on the phone) and it sets the order. The bundled articles
use 01–86; continue from the highest number. list_articles returns \`suggestedNextId\`.

## Style

- **Khmer first.** Write natural, warm, proofread Khmer, not a literal translation. The English title is only a label.
- **Short.** About five minutes to read: roughly 6–9 short sections or 2,500–4,000 characters. The hard limit is 100 KB.
- **One idea per article**, with a concrete small action the reader can try today.
- **Kind.** Missing a day is information, not failure. Never shame, never promise cures, never give medical advice.
- Read two or three existing articles with get_article before writing, to match tone and length.

## Workflow

1. get_platform_guide, then list_articles (avoid overlapping topics; note suggestedNextId).
2. Propose the title (English + Khmer), id and a section outline. Wait for the owner's OK.
3. Write the full article and run check_article. Fix every warning.
4. create_article (a draft). Summarise what you saved.
5. Only when told to, publish_article. To change a published article use update_article; phones pick up the correction on their next sync.

You cannot see readers, change settings, or touch anything but articles.
`
}
