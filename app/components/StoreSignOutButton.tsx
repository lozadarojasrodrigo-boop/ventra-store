'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { supabaseBrowser } from '@/lib/supabase/browser'

export function StoreSignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)
    await supabaseBrowser.auth.signOut()
    router.push('/')
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex min-h-[3rem] items-center justify-center rounded-full border border-[#0071e3]/10 bg-white px-5 py-3 text-sm font-semibold text-[#1d1d1f] transition hover:bg-[#f8fbff]"
    >
      {loading ? 'Cerrando...' : 'Cerrar sesión'}
    </button>
  )
}
