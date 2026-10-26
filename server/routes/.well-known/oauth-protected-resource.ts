import { protectedResourceMetadata } from '../../lib/oauth'

export default defineEventHandler((event) => metadataResponse(event, protectedResourceMetadata(siteOrigin(event))))
