import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect, useState } from 'react'
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
    }),
    // Rehydrate explicitly from useStoreHydrated rather than during module
    // init. zustand's persist runs its auto-hydration through a microtask even
    // for synchronous storage, so with auto-hydration the first client render
    // sees an empty store — which made a logged-in admin look like a guest and
    // bounce them off /admin. Owning the trigger makes the ordering explicit.
    skipHydration: true
  })
)

/** Shared so several components can call the hook without re-hydrating twice. */
let rehydration: Promise<void> | null = null

/**
 * Whether the persisted store has been applied, so auth/role decisions can be
 * trusted.
 *
 * Until this is true the store looks logged out even when a valid session is
 * saved in localStorage. Gate navigation and role-exclusive fetching on it.
 */
export const useStoreHydrated = () => {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let active = true
    const done = () => {
      if (active) setHydrated(true)
    }

    // Already applied (e.g. client-side navigation after the first mount).
    if (useStore.persist.hasHydrated()) {
      done()
      return
    }

    // Finish even if hydration fails: an unreadable store is an empty session,
    // and leaving this false forever would hang every role-gated view.
    const unsubscribe = useStore.persist.onFinishHydration(done)
    if (!rehydration) {
      rehydration = Promise.resolve(useStore.persist.rehydrate()).then(
        () => undefined,
        () => undefined
      )
    }
    void rehydration.then(done)

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return hydrated
}
