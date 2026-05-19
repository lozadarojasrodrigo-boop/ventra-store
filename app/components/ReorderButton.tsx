'use client'

import { useRouter } from 'next/navigation'

import { useCart, type CartItem } from '@/app/components/CartProvider'

type ReorderButtonProps = {
  items: CartItem[]
  className?: string
}

export function ReorderButton({ items, className = '' }: ReorderButtonProps) {
  const router = useRouter()
  const { addItems } = useCart()

  return (
    <button
      type="button"
      onClick={() => {
        addItems(items)
        router.push('/carrito')
      }}
      className={className}
    >
      Volver a pedir
    </button>
  )
}
