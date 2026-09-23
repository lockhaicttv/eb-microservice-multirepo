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
  setAuthentication: (accessToken, user) => set({ accessToken, user }),
  clearAuthentication: () => set({ accessToken: null, user: null })
})
