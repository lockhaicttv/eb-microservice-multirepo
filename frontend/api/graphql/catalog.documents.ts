export const CATALOG_DOCUMENTS = {
  EVENTS: /* GraphQL */ `
    query Events($search: String) {
      events(search: $search) {
        id
        title
        blurb
        ticketPrice
        ticketsLeft
      }
    }
  `,
  EVENT: /* GraphQL */ `
    query Event($id: String!) {
      event(id: $id) {
        id
        title
        blurb
        ticketPrice
        ticketsLeft
      }
    }
  `
} as const
