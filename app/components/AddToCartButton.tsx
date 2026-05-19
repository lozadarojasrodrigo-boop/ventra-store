'use client'

import {
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type TouchEvent,
} from 'react'
import { useRouter } from 'next/navigation'

import { useCart, type CartItem } from './CartProvider'

type AddToCartButtonProps = {
  product: Omit<CartItem, 'quantity'>
  quantity?: number
  className?: string
  children?: ReactNode
  redirectToCart?: boolean
  disabled?: boolean
}

export function AddToCartButton({
  product,
  quantity = 1,
  className,
  children,
  redirectToCart = false,
  disabled = false,
}: AddToCartButtonProps) {
  const router = useRouter()
  const { addItem } = useCart()
  const [flash, setFlash] = useState(false)
  const touchHandledRef = useRef(false)
  const lastTriggerRef = useRef(0)

  function activate() {
    if (disabled) {
      return
    }

    const now = Date.now()
    if (now - lastTriggerRef.current < 350) {
      return
    }

    lastTriggerRef.current = now
    addItem(product, quantity)

    if (redirectToCart) {
      router.push('/carrito')
      return
    }

    setFlash(true)
    window.setTimeout(() => setFlash(false), 1200)
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()

    if (touchHandledRef.current) {
      touchHandledRef.current = false
      return
    }

    activate()
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== 'touch') {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    touchHandledRef.current = true
    activate()
  }

  function handleTouchEnd(event: TouchEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    touchHandledRef.current = true
    activate()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerUp={handlePointerUp}
      onTouchEnd={handleTouchEnd}
      disabled={disabled}
      className={`relative z-10 touch-manipulation ${className || ''}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {flash ? 'Añadido' : children || 'Añadir al carrito'}
    </button>
  )
}
