export const CATALOG_DOCUMENTS = {
  EVENTS: /* GraphQL */ `
    query Events($search: String) {
      events(search: $search) {
        id
        title
        blurb
        ticketPrice
        ticketsLeft
        ownerUserId
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
        ownerUserId
      }
    }
  `,
  MY_EVENTS: /* GraphQL */ `
    query MyEvents {
      myEvents {
        id
        title
        blurb
        ticketPrice
        ticketsLeft
        ownerUserId
      }
    }
  `,
  CREATE_EVENT: /* GraphQL */ `
    mutation CreateEvent($input: CreateEventInput!) {
      createEvent(input: $input) {
        id
        title
        blurb
        ticketPrice
        ticketsLeft
        ownerUserId
      }
    }
  `
} as const
