import { authorizationServerMetadata } from '../../lib/oauth'

export default defineEventHandler((event) => metadataResponse(event, authorizationServerMetadata(siteOrigin(event))))
