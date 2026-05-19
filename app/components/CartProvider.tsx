'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type CartItem = {
  id: number
  nombre: string
  precio_venta: number
  imagen_url: string | null
  sku: string | null
  categoria: string | null
  stock_actual: number
  quantity: number
}

type CartContextValue = {
  items: CartItem[]
  hydrated: boolean
  itemCount: number
  subtotal: number
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  addItems: (items: CartItem[]) => void
  removeItem: (itemId: number) => void
  updateQuantity: (itemId: number, quantity: number) => void
  clearCart: () => void
}

const CART_STORAGE_KEY = 'ventra-store-cart'

const CartContext = createContext<CartContextValue | null>(null)

function readStoredCart() {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) {
      return [] as CartItem[]
    }

    const parsed = JSON.parse(raw) as CartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return [] as CartItem[]
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setItems(readStoredCart())
      setHydrated(true)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Ignore storage write failures on restricted browsers/devices.
    }
  }, [hydrated, items])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY) {
        return
      }

      try {
        const nextValue = event.newValue ? (JSON.parse(event.newValue) as CartItem[]) : []
        setItems(Array.isArray(nextValue) ? nextValue : [])
      } catch {
        setItems([])
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((entry) => entry.id === item.id)
      if (!existing) {
        return [
          ...current,
          {
            ...item,
            quantity: Math.min(Math.max(quantity, 1), Math.max(item.stock_actual, 1)),
          },
        ]
      }

      return current.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              quantity: Math.min(
                entry.quantity + Math.max(quantity, 1),
                Math.max(entry.stock_actual, 1)
              ),
            }
          : entry
      )
    })
  }, [])

  const removeItem = useCallback((itemId: number) => {
    setItems((current) => current.filter((entry) => entry.id !== itemId))
  }, [])

  const addItems = useCallback((incomingItems: CartItem[]) => {
    setItems((current) => {
      const next = [...current]

      for (const incoming of incomingItems) {
        const existingIndex = next.findIndex((entry) => entry.id === incoming.id)
        if (existingIndex === -1) {
          next.push({
            ...incoming,
            quantity: Math.min(
              Math.max(incoming.quantity, 1),
              Math.max(incoming.stock_actual, incoming.quantity, 1)
            ),
          })
          continue
        }

        const existing = next[existingIndex]
        next[existingIndex] = {
          ...existing,
          quantity: Math.min(
            existing.quantity + Math.max(incoming.quantity, 1),
            Math.max(existing.stock_actual, incoming.quantity, 1)
          ),
        }
      }

      return next
    })
  }, [])

  const updateQuantity = useCallback((itemId: number, quantity: number) => {
    setItems((current) =>
      current
        .map((entry) =>
          entry.id === itemId
            ? {
                ...entry,
                quantity: Math.min(Math.max(quantity, 1), Math.max(entry.stock_actual, 1)),
              }
            : entry
        )
        .filter((entry) => entry.quantity > 0)
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((total, item) => total + item.quantity, 0)
    const subtotal = items.reduce((total, item) => total + item.precio_venta * item.quantity, 0)

    return {
      items,
      hydrated,
      itemCount,
      subtotal,
      addItem,
      addItems,
      removeItem,
      updateQuantity,
      clearCart,
    }
  }, [addItem, addItems, clearCart, hydrated, items, removeItem, updateQuantity])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }

  return context
}
