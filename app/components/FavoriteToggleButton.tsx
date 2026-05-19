'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { supabaseBrowser } from '@/lib/supabase/browser'

type FavoriteToggleButtonProps = {
  productId: number
  initialActive?: boolean
  iconOnly?: boolean
  className?: string
}

export function FavoriteToggleButton({
  productId,
  initialActive = false,
  iconOnly = false,
  className = '',
}: FavoriteToggleButtonProps) {
  const router = useRouter()
  const [active, setActive] = useState(initialActive)
  const [submitting, setSubmitting] = useState(false)

  const label = useMemo(
    () => (active ? 'Quitar de favoritos' : 'Guardar en favoritos'),
    [active]
  )

  async function handleToggle() {
    if (submitting) return

    setSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser()

      if (!user) {
        router.push('/ingresar')
        return
      }

      if (active) {
        const { error } = await supabaseBrowser
          .from('store_customer_favorites')
          .delete()
          .eq('auth_user_id', user.id)
          .eq('product_id', productId)

        if (error) throw error
        setActive(false)
      } else {
        const { error } = await supabaseBrowser.from('store_customer_favorites').insert({
          auth_user_id: user.id,
          product_id: productId,
        })

        if (error) throw error
        setActive(true)
      }

      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={label}
      disabled={submitting}
      className={
        className ||
        `inline-flex items-center justify-center rounded-full border border-[#0071e3]/12 bg-white px-4 py-2 text-[0.82rem] font-semibold transition ${
          active ? 'text-[#0071e3]' : 'text-[#1d1d1f]'
        }`
      }
    >
      <svg
        viewBox="0 0 24 24"
        width={iconOnly ? 18 : 16}
        height={iconOnly ? 18 : 16}
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={iconOnly ? '' : 'mr-2'}
      >
        <path d="m12 20.4-1.1-1C5.2 14.2 2 11.3 2 7.8 2 5 4.2 3 7 3c1.6 0 3.1.8 4 2 0.9-1.2 2.4-2 4-2 2.8 0 5 2 5 4.8 0 3.5-3.2 6.4-8.9 11.6L12 20.4Z" />
      </svg>
      {iconOnly ? null : active ? 'Guardado' : 'Favorito'}
    </button>
  )
}
