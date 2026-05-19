'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { supabaseBrowser } from '@/lib/supabase/browser'

function getDisplayName(user: User | null) {
  const firstName = user?.user_metadata?.first_name
  const lastName = user?.user_metadata?.last_name
  if (typeof firstName === 'string' && firstName.trim()) {
    return [firstName.trim(), typeof lastName === 'string' ? lastName.trim() : '']
      .filter(Boolean)
      .join(' ')
  }
  const fullName = user?.user_metadata?.full_name
  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim()
  }
  const email = user?.email || ''
  return email ? email.split('@')[0] : 'Mi cuenta'
}

export function StoreAccountButton() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let active = true

    supabaseBrowser.auth.getUser().then(({ data }) => {
      if (active) {
        setUser(data.user ?? null)
      }
    })

    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return user ? (
    <Link
      href="/cuenta"
      className="inline-flex min-h-[2.85rem] items-center justify-center rounded-full px-4 text-[0.92rem] font-medium text-[#1d1d1f] transition hover:bg-black/4"
    >
      {getDisplayName(user)}
    </Link>
  ) : (
    <Link
      href="/ingresar"
      aria-label="Ingresar o crear cuenta"
      className="inline-flex h-[2.9rem] w-[2.9rem] items-center justify-center rounded-full border border-[#0071e3]/12 bg-white text-[#1d1d1f] transition hover:bg-[#f8fbff]"
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
      </svg>
    </Link>
  )
}
