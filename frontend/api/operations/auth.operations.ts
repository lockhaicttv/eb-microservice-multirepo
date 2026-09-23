import { AUTH_DOCUMENTS } from '../graphql/auth.documents'
import type { AuthPayloadModel, UserModel } from '@/types/api.types'
import type { GraphQLClient } from 'graphql-request'

export interface AuthOperationsOptions {
  client: GraphQLClient
}

export const createAuthOperations = ({ client }: AuthOperationsOptions) => ({
  me: () => client.request<{ me?: UserModel | null }>(AUTH_DOCUMENTS.ME).then((res) => res.me ?? null),

  login: (params: { email: string; password: string }) =>
    client.request<{ login: AuthPayloadModel }>(AUTH_DOCUMENTS.LOGIN, params).then((res) => res.login),

  register: (params: { name: string; email: string; password: string }) =>
    client.request<{ register: AuthPayloadModel }>(AUTH_DOCUMENTS.REGISTER, params).then((res) => res.register)
})

export type AuthOperations = ReturnType<typeof createAuthOperations>
