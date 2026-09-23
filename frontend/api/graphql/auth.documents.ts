export const AUTH_DOCUMENTS = {
  ME: /* GraphQL */ `
    query Me {
      me {
        id
        name
        email
      }
    }
  `,
  LOGIN: /* GraphQL */ `
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        accessToken
        user {
          id
          name
          email
        }
      }
    }
  `,
  REGISTER: /* GraphQL */ `
    mutation Register($email: String!, $password: String!, $name: String!) {
      register(email: $email, password: $password, name: $name) {
        accessToken
        user {
          id
          name
          email
        }
      }
    }
  `
} as const
