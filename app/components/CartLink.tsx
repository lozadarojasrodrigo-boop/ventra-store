'use client'

import Link from 'next/link'

import { useCart } from '@/app/components/CartProvider'

export function CartLink() {
  const { itemCount, hydrated } = useCart()

  return (
    <Link
      href="/carrito"
      aria-label="Carrito"
      className="relative inline-flex h-[3.3rem] w-[3.3rem] items-center justify-center text-[#1d1d1f] transition hover:text-[#0071e3]"
    >
      <svg
        viewBox="0 0 24 24"
        width="27"
        height="27"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <path d="M5.5 8.5h13l-1.35 9.2a1 1 0 0 1-.99.8H7.85a1 1 0 0 1-.99-.8L5.5 8.5Z" />
        <path d="M8.25 8.5 12 4.5 15.75 8.5" />
        <path d="M9 11.25v4.5" />
        <path d="M12 11.25v4.5" />
        <path d="M15 11.25v4.5" />
      </svg>
      <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-[1.3rem] min-w-[1.3rem] items-center justify-center rounded-full bg-[#0071e3] px-1 text-[0.68rem] font-semibold text-white">
        {hydrated ? itemCount : 0}
      </span>
    </Link>
  )
}
