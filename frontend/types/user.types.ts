/**
 * Mirrors the auth-bff `UserRole` GraphQL enum.
 *
 * Unknown values are treated as CUSTOMER at runtime (see `normalizeRole`), so a
 * role added by a newer backend cannot accidentally unlock UI in an older app.
 */
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  EVENT_OWNER: 'EVENT_OWNER',
  CUSTOMER: 'CUSTOMER'
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

const ALL_ROLES: readonly string[] = Object.values(USER_ROLES)

export function normalizeRole(value: unknown): UserRole {
  return typeof value === 'string' && ALL_ROLES.includes(value) ? (value as UserRole) : USER_ROLES.CUSTOMER
}

export interface UserModel {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface AuthPayloadModel {
  accessToken: string
  user: UserModel
}