import { removeClient } from '../../../../lib/oauth'

export default defineEventHandler(async (event) => {
  await removeClient(useDb(event), getRouterParam(event, 'id') || '')
  return { ok: true }
})
