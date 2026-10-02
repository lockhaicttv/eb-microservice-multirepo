import { AUTH_DOCUMENTS } from '../graphql/auth.documents'
import { normalizeRole } from '@/types/user.types'
import type { AuthPayloadModel, UserModel, UserRole } from '@/types/api.types'
import type { GraphQLClient } from 'graphql-request'

export interface AuthOperationsOptions {
  client: GraphQLClient
}

/** Apply the same fail-closed default the BFF applies before data reaches state. */
const withRole = (user: UserModel): UserModel => ({ ...user, role: normalizeRole(user.role) })

const withPayload = (payload: AuthPayloadModel): AuthPayloadModel => ({
  accessToken: payload.accessToken,
  user: withRole(payload.user)
})

export const createAuthOperations = ({ client }: AuthOperationsOptions) => ({
  me: () =>
    client
      .request<{ me?: UserModel | null }>(AUTH_DOCUMENTS.ME)
      .then((res) => (res.me ? withRole(res.me) : null)),

  login: (params: { email: string; password: string }) =>
    client
      .request<{ login: AuthPayloadModel }>(AUTH_DOCUMENTS.LOGIN, params)
      .then((res) => withPayload(res.login)),

  register: (params: { name: string; email: string; password: string }) =>
    client
      .request<{ register: AuthPayloadModel }>(AUTH_DOCUMENTS.REGISTER, params)
      .then((res) => withPayload(res.register)),

  /** Admin only — throws FORBIDDEN for any other role. */
  users: () => client.request<{ users: UserModel[] }>(AUTH_DOCUMENTS.USERS).then((res) => res.users.map(withRole)),

  /** Admin only — promotes/demotes between CUSTOMER and EVENT_OWNER. */
  setUserRole: (params: { userId: string; role: UserRole }) =>
    client
      .request<{ setUserRole: UserModel }>(AUTH_DOCUMENTS.SET_USER_ROLE, params)
      .then((res) => withRole(res.setUserRole))
})

export type AuthOperations = ReturnType<typeof createAuthOperations>