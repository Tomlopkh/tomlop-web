import type { H3Event } from 'h3'

/** Canonical origin, from config rather than the Host header. */
export function siteOrigin(event: H3Event): string {
  return new URL(useRuntimeConfig(event).public.siteUrl).origin
}

/** The protected resource: the MCP endpoint. */
export function mcpResource(event: H3Event): string {
  return `${siteOrigin(event)}/mcp`
}

/** CORS for OAuth metadata, registration and token endpoints (browser-based MCP inspectors call them). */
export function oauthCors(event: H3Event) {
  setHeaders(event, {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type, mcp-protocol-version',
    'access-control-max-age': 86400,
  })
}

export function metadataResponse(event: H3Event, body: unknown) {
  oauthCors(event)
  setHeader(event, 'cache-control', 'public, max-age=300')
  if (event.method === 'OPTIONS') return null
  return body
}
