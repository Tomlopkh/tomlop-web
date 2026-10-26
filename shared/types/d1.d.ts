// The slice of Cloudflare D1's API this project uses. @cloudflare/workers-types would declare
// it too, but redeclares the DOM's Request/Response and breaks the rest of the server types.
interface D1Meta { changes: number, last_row_id: number, duration: number }

interface D1Result<T = unknown> {
  results: T[]
  success: boolean
  meta: D1Meta
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = Record<string, unknown>>(): Promise<T | null>
  run(): Promise<D1Result>
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>
}

interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>
}
