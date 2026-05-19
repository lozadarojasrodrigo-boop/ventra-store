import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { CartLink } from '@/app/components/CartLink'
import { StoreAccountButton } from '@/app/components/StoreAccountButton'

type NavLink = {
  href: string
  label: string
}

type StoreHeaderProps = {
  navLinks?: NavLink[]
  searchSlot?: ReactNode
  utilitySlot?: ReactNode
}

export function StoreHeader({
  navLinks = [],
  searchSlot,
  utilitySlot,
}: StoreHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-black/6 bg-[#fbfbfd]/84 backdrop-blur-2xl">
      <div className="store-shell grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 py-3 sm:gap-x-4 sm:py-4 md:grid-cols-[auto_1fr_auto] md:gap-5 md:py-5">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80 sm:gap-3">
            <div className="overflow-hidden rounded-[15px] bg-white p-1 shadow-[0_6px_18px_rgba(0,0,0,0.06)] transition duration-300 hover:shadow-[0_14px_30px_rgba(0,0,0,0.1)] sm:rounded-[18px] sm:p-1.5">
              <Image
                src="/logostore.png"
                alt="VENTRA"
                width={78}
                height={78}
                priority
                className="h-auto w-[2.95rem] rounded-[12px] sm:w-[3.3rem] md:w-[4rem] md:rounded-[14px]"
              />
            </div>
            <div>
              <p className="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-[#65656b] sm:text-[0.9rem] sm:tracking-[0.2em] md:text-[0.96rem] md:tracking-[0.22em]">
                VENTRA
              </p>
              <p className="mt-0.5 text-[0.76rem] text-[#86868b] sm:text-[0.84rem] md:text-[0.92rem]">
                Tienda online
              </p>
            </div>
          </Link>
        </div>

        {navLinks.length > 0 ? (
          <nav className="hidden items-center justify-center gap-7 text-[0.86rem] text-[#1d1d1f] lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-2 py-2 transition duration-300 hover:bg-black/4 hover:text-black/65"
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : (
          <div className="hidden md:block" />
        )}

        <div className="flex items-center justify-end gap-1.5 sm:gap-2 md:flex-nowrap">
          {searchSlot}
          <StoreAccountButton />
          <CartLink />
          {utilitySlot}
        </div>
      </div>
    </header>
  )
}
