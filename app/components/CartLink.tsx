'use client'

import Link from 'next/link'

import { useCart } from '@/app/components/CartProvider'

export function CartLink() {
  const { itemCount, hydrated } = useCart()

  return (
    <Link
      href="/carrito"
      aria-label="Carrito"
      className="relative inline-flex h-[2.85rem] w-[2.85rem] items-center justify-center text-[#1d1d1f] transition hover:text-[#0071e3] sm:h-[3.05rem] sm:w-[3.05rem] md:h-[3.3rem] md:w-[3.3rem]"
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        className="sm:h-[24px] sm:w-[24px] md:h-[27px] md:w-[27px]"
      >
        <path d="M5.5 8.5h13l-1.35 9.2a1 1 0 0 1-.99.8H7.85a1 1 0 0 1-.99-.8L5.5 8.5Z" />
        <path d="M8.25 8.5 12 4.5 15.75 8.5" />
        <path d="M9 11.25v4.5" />
        <path d="M12 11.25v4.5" />
        <path d="M15 11.25v4.5" />
      </svg>
      <span className="absolute -right-1 -top-1 inline-flex min-h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full bg-[#0071e3] px-1 text-[0.62rem] font-semibold text-white sm:-right-1.5 sm:-top-1.5 sm:min-h-[1.22rem] sm:min-w-[1.22rem] sm:text-[0.66rem] md:min-h-[1.3rem] md:min-w-[1.3rem] md:text-[0.68rem]">
        {hydrated ? itemCount : 0}
      </span>
    </Link>
  )
}
