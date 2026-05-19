'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { supabaseBrowser } from '@/lib/supabase/browser'

type StoreReviewFormProps = {
  productId: number
}

export function StoreReviewForm({ productId }: StoreReviewFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  async function submitReview() {
    if (submitting) return

    setSubmitting(true)
    setMessage('')

    try {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser()

      if (!user) {
        router.push('/ingresar')
        return
      }

      const firstName =
        typeof user.user_metadata?.first_name === 'string' ? user.user_metadata.first_name.trim() : ''
      const lastName =
        typeof user.user_metadata?.last_name === 'string' ? user.user_metadata.last_name.trim() : ''
      const displayName =
        [firstName, lastName].filter(Boolean).join(' ') ||
        (typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '') ||
        (user.email ? user.email.split('@')[0] : 'Cliente')

      const { error } = await supabaseBrowser.from('store_product_reviews').insert({
        auth_user_id: user.id,
        product_id: productId,
        nombre_mostrado: displayName,
        rating,
        comentario: comment.trim(),
      })

      if (error) throw error

      setComment('')
      setRating(5)
      setMessage('Gracias por compartir tu opinión.')
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar tu reseña.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <article className="rounded-[24px] border border-[#0071e3]/10 bg-[#fbfcff] p-5">
      <div className="flex flex-wrap items-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${
              value <= rating
                ? 'border-[#0071e3] bg-[#0071e3] text-white'
                : 'border-[#0071e3]/12 bg-white text-[#6e6e73]'
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Escribe tu opinión"
        className="mt-4 min-h-[7rem] w-full rounded-[18px] border border-[#0071e3]/10 bg-white px-4 py-3 text-[0.96rem] text-[#1d1d1f] outline-none focus:border-[#0071e3]/35"
      />

      {message ? <p className="mt-3 text-[0.92rem] text-[#424245]">{message}</p> : null}

      <button
        type="button"
        onClick={submitReview}
        disabled={submitting || !comment.trim()}
        className="mt-4 inline-flex min-h-[2.9rem] items-center justify-center rounded-full bg-[#0071e3] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0077ed]"
      >
        {submitting ? 'Enviando...' : 'Publicar reseña'}
      </button>
    </article>
  )
}
