import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StateCreator } from 'zustand'
import { createAuthenticationSlice } from './slices/authentication.slice'
import { createCartSlice } from './slices/cart.slice'
import type { AuthenticationSlice } from './slices/authentication.slice'
import type { CartSlice } from './slices/cart.slice'

export interface AppStore extends AuthenticationSlice, CartSlice {}

export const createAppStore: StateCreator<AppStore> = (set, get, api) => ({
  ...createAuthenticationSlice(set, get, api),
  ...createCartSlice(set, get, api)
})

export const useStore = create<AppStore>()(
  persist(createAppStore, {
    name: 'pulse-events-store',
    partialize: (state) => ({
      accessToken: state.accessToken,
      user: state.user,
      cart: state.cart
    })
  })
)
