const USER_FIELDS = /* GraphQL */ `
  id
  name
  email
  role
`

export const AUTH_DOCUMENTS = {
  ME: /* GraphQL */ `
    query Me {
      me {
        ${USER_FIELDS}
      }
    }
  `,
  LOGIN: /* GraphQL */ `
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        accessToken
        user {
          ${USER_FIELDS}
        }
      }
    }
  `,
  REGISTER: /* GraphQL */ `
    mutation Register($email: String!, $password: String!, $name: String!) {
      register(email: $email, password: $password, name: $name) {
        accessToken
        user {
          ${USER_FIELDS}
        }
      }
    }
  `,
  // Admin only. The server enforces this; the query is not sent for other roles.
  USERS: /* GraphQL */ `
    query Users {
      users {
        ${USER_FIELDS}
      }
    }
  `,
  SET_USER_ROLE: /* GraphQL */ `
    mutation SetUserRole($userId: String!, $role: UserRole!) {
      setUserRole(userId: $userId, role: $role) {
        ${USER_FIELDS}
      }
    }
  `
} as const