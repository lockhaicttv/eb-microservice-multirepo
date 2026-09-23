import { CATALOG_DOCUMENTS } from './../graphql/catalog.documents'
import type { EventModel } from '@/types/api.types'
import type { GraphQLClient } from 'graphql-request'

export const createCatalogOperations = (client: GraphQLClient) => ({
  events: (search?: string) =>
    client.request<{ events: EventModel[] }>(CATALOG_DOCUMENTS.EVENTS, { search }).then((res) => res.events),

  event: (id: string) =>
    client.request<{ event: EventModel | null }>(CATALOG_DOCUMENTS.EVENT, { id }).then((res) => res.event)
})

export type CatalogOperations = ReturnType<typeof createCatalogOperations>
