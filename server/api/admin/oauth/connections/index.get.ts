import { listConnections } from '../../../../lib/oauth'

export default defineEventHandler(async (event) => ({
  mcpUrl: mcpResource(event),
  connections: await listConnections(useDb(event)),
}))
