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
      <div className="store-shell grid grid-cols-1 items-center gap-4 py-4 md:grid-cols-[auto_1fr_auto] md:gap-5 md:py-5">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="overflow-hidden rounded-[18px] bg-white p-1.5 shadow-[0_8px_22px_rgba(0,0,0,0.06)] transition duration-300 hover:shadow-[0_14px_30px_rgba(0,0,0,0.1)]">
              <Image
                src="/logostore.png"
                alt="VENTRA"
                width={78}
                height={78}
                priority
                className="h-auto w-[4rem] rounded-[14px]"
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-[0.96rem] font-semibold uppercase tracking-[0.22em] text-[#65656b]">
                VENTRA
              </p>
              <p className="mt-0.5 text-[0.92rem] text-[#86868b]">Tienda online</p>
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
          <div />
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 md:flex-nowrap">
          {searchSlot}
          <StoreAccountButton />
          <CartLink />
          {utilitySlot}
        </div>
      </div>
    </header>
  )
}
