# 0005. One article format and one validator, shared by server and browser

- **Status:** Accepted
- **Date:** 2026-10-26
- **Deciders:** Chamrong

## Context
The same Markdown file is rendered by the Android app (Kotlin) and by the website (Vue). It is also written by a human in the backoffice and by an AI over MCP.
The first website renderer escaped `**bold**` literally while the app rendered it, which shipped as a visible bug: all 86 articles use bold (377 times).
A second failure: the AI guide initially listed bold as unsupported. Three places disagreed about the format.

## Decision
The format is tiny and strict: a `# English / ខ្មែរ` heading, intro lines, `## sections` of plain lines and `- bullets`, and one inline style, `**bold**`.
Its parser, validator and bold splitter live once in `shared/utils/` and are used by the server (saving, the feed, the AI tools) **and** the browser (the live preview and live checks).
The website renders the same component in the public page and in the editor preview, so the preview cannot drift from what readers see.
The bold rule is a line-for-line mirror of `parseMarkdownBold` in the app, including its behaviour for an unbalanced marker.
A parity test runs the parser over all 86 bundled articles and compares titles, reading minutes, byte counts and SHA-256 to the committed feed.

## Consequences
- An article that saves in the backoffice also saves over MCP and renders the same everywhere.
- The Kotlin parser is still a manual mirror. The parity test protects the web side; a change to `parseReadingArticle` must be made in both repos. A shared test fixture is on the roadmap.
- The format cannot express headings below `##`, numbered lists, links, images or italics. This is deliberate (Khmer reading comfort, small app, one renderer) and the validator warns when an author tries.

## Alternatives considered
- **Full CommonMark.** Larger renderer in the app and many ways for the same file to look different per surface.
- **Structured JSON blocks.** Better for tooling, worse for humans and for AI, and incompatible with the 86 existing files.

## Links
`shared/utils/article-format.ts` · `shared/utils/inline.ts` · `server/lib/markdown.test.ts` · app repo `ReadingArticles.kt`
