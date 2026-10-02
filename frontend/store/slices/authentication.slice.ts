import { normalizeRole } from '@/types/user.types'
import type { UserModel } from '@/types/api.types'
import type { StateCreator } from 'zustand'
import type { AppStore } from '../useStore'

export interface AuthenticationSlice {
  accessToken: string | null
  user: UserModel | null
  setAuthentication: (accessToken: string, user: UserModel) => void
  clearAuthentication: () => void
}

export const createAuthenticationSlice: StateCreator<AppStore, [], [], AuthenticationSlice> = (set) => ({
  accessToken: null,
  user: null,
  // Normalise on the way in: this is the last point before the role reaches
  // components, so an unexpected value becomes CUSTOMER here.
  setAuthentication: (accessToken, user) =>
    set({ accessToken, user: { ...user, role: normalizeRole(user.role) } }),
  clearAuthentication: () => set({ accessToken: null, user: null })
})