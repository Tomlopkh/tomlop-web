import { z } from 'zod'
import { deleteArticle, getArticle, listArticles, nextArticleId, saveArticle, setPublished, validateArticle } from '../articles'
import { platformGuide } from './guide'

export interface ToolContext {
  db: D1Database
  clientName: string
  /** Drop cached copies of the feed and this article's pages after a change. */
  purge: (id: string) => Promise<void>
}

type ToolResult = { content: { type: 'text', text: string }[], isError?: boolean }

const id = z.string().trim().min(1).max(100).describe('Article id such as 87-my-article')
const markdown = z.string().min(1).max(150_000).describe('The full article in the Tomlop Markdown format (see get_platform_guide)')

interface ToolDef<S extends z.ZodType> {
  name: string
  title: string
  description: string
  schema: S
  annotations: { readOnlyHint?: boolean, destructiveHint?: boolean, idempotentHint?: boolean, openWorldHint?: boolean }
  run: (args: z.infer<S>, ctx: ToolContext) => Promise<unknown>
}

const text = (value: unknown): ToolResult => ({ content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] })
const fail = (message: string): ToolResult => ({ content: [{ type: 'text', text: message }], isError: true })

// Each tool's `run` is typed against its own schema; the registry erases that so one list can hold them all.
const defineTool = <S extends z.ZodType>(tool: ToolDef<S>) => tool as unknown as ToolDef<z.ZodType>

const tools: ToolDef<z.ZodType>[] = [
  defineTool({
    name: 'get_platform_guide',
    title: 'Read the platform guide',
    description: 'The article format, ids, limits, style and workflow. Call this first.',
    schema: z.object({}),
    annotations: { readOnlyHint: true },
    run: async () => platformGuide(),
  }),
  defineTool({
    name: 'list_articles',
    title: 'List articles',
    description: 'Every article including drafts, in library order, with the next unused id.',
    schema: z.object({}),
    annotations: { readOnlyHint: true },
    run: async (_args, ctx) => {
      const rows = await listArticles(ctx.db, false)
      return {
        count: rows.length,
        suggestedNextId: nextArticleId(rows.map((r) => r.id)),
        articles: rows.map((r) => ({ id: r.id, titleEn: r.title_en, titleKm: r.title_km, readingMinutes: r.reading_minutes, published: r.published === 1, updatedAt: r.updated_at })),
      }
    },
  }),
  defineTool({
    name: 'get_article',
    title: 'Read one article',
    description: 'One article\'s Markdown and details, drafts included.',
    schema: z.object({ id }),
    annotations: { readOnlyHint: true },
    run: async ({ id: articleId }: { id: string }, ctx) => {
      const row = await getArticle(ctx.db, articleId)
      if (!row) throw new Error(`No article with id ${articleId}.`)
      return { id: row.id, published: row.published === 1, readingMinutes: row.reading_minutes, updatedAt: row.updated_at, markdown: row.body }
    },
  }),
  defineTool({
    name: 'check_article',
    title: 'Check article Markdown',
    description: 'Validate an article without saving it: reports errors and warnings about unsupported syntax, missing Khmer, length.',
    schema: z.object({ id, markdown }),
    annotations: { readOnlyHint: true },
    run: async ({ id: articleId, markdown: md }: { id: string, markdown: string }) => {
      const checked = validateArticle(articleId, md)
      if (!checked.ok) return { ok: false, error: checked.error }
      return { ok: true, titleEn: checked.parsed.titleEn, titleKm: checked.parsed.titleKm, readingMinutes: checked.parsed.minutes, sections: checked.parsed.sections.length, warnings: checked.warnings }
    },
  }),
  defineTool({
    name: 'create_article',
    title: 'Create an article (draft)',
    description: 'Save a new article as a draft. It is not visible to readers until publish_article.',
    schema: z.object({ id, markdown }),
    annotations: { idempotentHint: false },
    run: async ({ id: articleId, markdown: md }: { id: string, markdown: string }, ctx) => {
      const result = await saveArticle(ctx.db, articleId, md, false, 'create')
      if (!result.ok) throw new Error(result.error)
      await ctx.purge(articleId)
      return { saved: articleId, published: false, warnings: result.warnings }
    },
  }),
  defineTool({
    name: 'update_article',
    title: 'Update an article',
    description: 'Replace an article\'s Markdown. Does not change whether it is published; phones pick up a correction on their next sync.',
    schema: z.object({ id, markdown }),
    annotations: { idempotentHint: true },
    run: async ({ id: articleId, markdown: md }: { id: string, markdown: string }, ctx) => {
      const current = await getArticle(ctx.db, articleId)
      if (!current) throw new Error(`No article with id ${articleId}.`)
      const result = await saveArticle(ctx.db, articleId, md, current.published === 1, 'update')
      if (!result.ok) throw new Error(result.error)
      await ctx.purge(articleId)
      return { saved: articleId, published: current.published === 1, warnings: result.warnings }
    },
  }),
  defineTool({
    name: 'publish_article',
    title: 'Publish or unpublish',
    description: 'Make an article live for the app and website, or send it back to draft. Only do this when the owner asked.',
    schema: z.object({ id, published: z.boolean().describe('true to publish, false to return to draft') }),
    annotations: { idempotentHint: true },
    run: async ({ id: articleId, published }: { id: string, published: boolean }, ctx) => {
      if (!(await setPublished(ctx.db, articleId, published))) throw new Error(`No article with id ${articleId}.`)
      await ctx.purge(articleId)
      return { id: articleId, published }
    },
  }),
  defineTool({
    name: 'delete_article',
    title: 'Delete an article',
    description: 'Permanently remove an article from the site. Phones that already downloaded it keep their copy; bundled articles stay in the app.',
    schema: z.object({ id }),
    annotations: { destructiveHint: true },
    run: async ({ id: articleId }: { id: string }, ctx) => {
      if (!(await deleteArticle(ctx.db, articleId))) throw new Error(`No article with id ${articleId}.`)
      await ctx.purge(articleId)
      return { deleted: articleId }
    },
  }),
]

export function listTools() {
  return tools.map((t) => ({
    name: t.name,
    title: t.title,
    description: t.description,
    inputSchema: z.toJSONSchema(t.schema, { target: 'draft-7' }),
    annotations: { title: t.title, openWorldHint: false, ...t.annotations },
  }))
}

export async function callTool(name: string, rawArgs: unknown, ctx: ToolContext): Promise<ToolResult> {
  const tool = tools.find((t) => t.name === name)
  if (!tool) return fail(`Unknown tool: ${name}`)
  const parsed = tool.schema.safeParse(rawArgs ?? {})
  if (!parsed.success) return fail(`Invalid arguments: ${parsed.error.issues.map((i) => `${i.path.join('.') || 'input'}: ${i.message}`).join('; ')}`)
  try {
    return text(await tool.run(parsed.data, ctx))
  }
  catch (error) {
    return fail(error instanceof Error ? error.message : 'The tool failed.')
  }
}
