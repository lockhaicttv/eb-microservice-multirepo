import { CATALOG_DOCUMENTS } from './../graphql/catalog.documents'
import type { EventModel } from '@/types/api.types'
import type { GraphQLClient } from 'graphql-request'

export interface CreateEventInput {
  title: string
  blurb?: string
  ticketPrice: number
  tickets: number
}

export const createCatalogOperations = (client: GraphQLClient) => ({
  events: (search?: string) =>
    client.request<{ events: EventModel[] }>(CATALOG_DOCUMENTS.EVENTS, { search }).then((res) => res.events),

  event: (id: string) =>
    client.request<{ event: EventModel | null }>(CATALOG_DOCUMENTS.EVENT, { id }).then((res) => res.event),

  /**
   * Owner dashboard. Returns this user's own listings only — the backend scopes
   * the query to the verified caller, so there is no owner id to pass in.
   */
  myEvents: () =>
    client.request<{ myEvents: EventModel[] }>(CATALOG_DOCUMENTS.MY_EVENTS).then((res) => res.myEvents),

  createEvent: (input: CreateEventInput) =>
    client
      .request<{ createEvent: EventModel }>(CATALOG_DOCUMENTS.CREATE_EVENT, { input })
      .then((res) => res.createEvent)
})

export type CatalogOperations = ReturnType<typeof createCatalogOperations>
