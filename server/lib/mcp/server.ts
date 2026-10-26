import { platformGuide, SHORT_INSTRUCTIONS } from './guide'
import { callTool, listTools, type ToolContext } from './tools'

/**
 * A small, stateless MCP server (Streamable HTTP transport, JSON responses, no sessions),
 * written by hand so it runs in a Cloudflare Worker with no extra dependencies.
 * Spec: https://modelcontextprotocol.io/specification
 */
export const SUPPORTED_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'] as const
export const SERVER_INFO = { name: 'tomlop', title: 'Tomlop', version: '1.0.0' }

export interface JsonRpcRequest { jsonrpc: '2.0', id?: string | number | null, method: string, params?: Record<string, unknown> }
export type JsonRpcResponse =
  | { jsonrpc: '2.0', id: string | number | null, result: unknown }
  | { jsonrpc: '2.0', id: string | number | null, error: { code: number, message: string, data?: unknown } }

const GUIDE_URI = 'tomlop://guide'

const PROMPTS = [
  {
    name: 'write_article',
    title: 'Write an article',
    description: 'Outline and write a Khmer article as a draft, in the library\'s format.',
    arguments: [
      { name: 'topic', description: 'What the article is about', required: true },
      { name: 'angle', description: 'Audience, angle or key points to cover', required: false },
    ],
  },
]

function articlePromptText(args: Record<string, string>): string {
  return `Write a Khmer article for the Tomlop library about: ${args.topic || '(ask me)'}${args.angle ? `\nAngle: ${args.angle}` : ''}

1. Call get_platform_guide and list_articles (to avoid overlap and get suggestedNextId). Read two existing articles with get_article to match tone and length.
2. Propose the English and Khmer titles, the id and a section outline. Wait for my OK.
3. Write the full article, check it with check_article and fix every warning, then save it with create_article (a draft).
4. Summarise what you saved. Do not publish until I say so.`
}

export async function handleRpc(message: JsonRpcRequest, ctx: ToolContext): Promise<JsonRpcResponse | null> {
  const id = message.id ?? null
  const isNotification = message.id === undefined
  const reply = (result: unknown): JsonRpcResponse => ({ jsonrpc: '2.0', id, result })
  const fail = (code: number, msg: string): JsonRpcResponse => ({ jsonrpc: '2.0', id, error: { code, message: msg } })

  if (message?.jsonrpc !== '2.0' || typeof message.method !== 'string') return isNotification ? null : fail(-32600, 'Invalid request')
  if (isNotification) return null // notifications/initialized, notifications/cancelled… need no answer

  const params = message.params || {}
  switch (message.method) {
    case 'initialize': {
      const requested = String(params.protocolVersion || '')
      const protocolVersion = (SUPPORTED_VERSIONS as readonly string[]).includes(requested) ? requested : SUPPORTED_VERSIONS[0]
      return reply({
        protocolVersion,
        capabilities: { tools: { listChanged: false }, resources: { listChanged: false }, prompts: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: SHORT_INSTRUCTIONS,
      })
    }
    case 'ping':
      return reply({})
    case 'tools/list':
      return reply({ tools: listTools() })
    case 'tools/call':
      return reply(await callTool(String(params.name || ''), params.arguments, ctx))
    case 'resources/list':
      return reply({ resources: [{ uri: GUIDE_URI, name: 'platform-guide', title: 'Platform guide', description: 'How to write articles for Tomlop', mimeType: 'text/markdown' }] })
    case 'resources/templates/list':
      return reply({ resourceTemplates: [] })
    case 'resources/read':
      if (params.uri !== GUIDE_URI) return fail(-32002, 'Resource not found')
      return reply({ contents: [{ uri: GUIDE_URI, mimeType: 'text/markdown', text: platformGuide() }] })
    case 'prompts/list':
      return reply({ prompts: PROMPTS })
    case 'prompts/get': {
      const prompt = PROMPTS.find((p) => p.name === params.name)
      if (!prompt) return fail(-32602, 'Unknown prompt')
      return reply({
        description: prompt.description,
        messages: [{ role: 'user', content: { type: 'text', text: articlePromptText((params.arguments || {}) as Record<string, string>) } }],
      })
    }
    default:
      return fail(-32601, `Method not found: ${message.method}`)
  }
}
