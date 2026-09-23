import type { CartLine } from '@/types/api.types'
import type { StateCreator } from 'zustand'
import type { AppStore } from '../useStore'

export interface CartSlice {
  cart: CartLine[]
  addToCart: (line: CartLine) => void
  updateQuantity: (eventId: string, quantity: number) => void
  removeFromCart: (eventId: string) => void
  clearCart: () => void
  cartTotal: (cart: CartLine[]) => number
}

export const createCartSlice: StateCreator<AppStore, [], [], CartSlice> = (set) => ({
  cart: [],
  addToCart: (line) =>
    set((state) => {
      const existing = state.cart.find((c) => c.eventId === line.eventId)
      if (existing) {
        return {
          cart: state.cart.map((c) => (c.eventId === line.eventId ? { ...c, quantity: c.quantity + line.quantity } : c))
        }
      }
      return { cart: [...state.cart, line] }
    }),
  updateQuantity: (eventId, quantity) =>
    set((state) => ({
      cart:
        quantity <= 0
          ? state.cart.filter((c) => c.eventId !== eventId)
          : state.cart.map((c) => (c.eventId === eventId ? { ...c, quantity } : c))
    })),
  removeFromCart: (eventId) => set((state) => ({ cart: state.cart.filter((c) => c.eventId !== eventId) })),
  clearCart: () => set({ cart: [] }),
  cartTotal: (cart) => cart.reduce((sum, item) => sum + item.ticketPrice * item.quantity, 0)
})
