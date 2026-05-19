'use client'

import { useState } from 'react'

import { supabaseBrowser } from '@/lib/supabase/browser'

export function StoreForgotPasswordPanel() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function handleSubmit() {
    if (submitting) return

    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const redirectTo = `${window.location.origin}/actualizar-password`
      const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
        redirectTo,
      })

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setSuccessMessage('Te enviamos un enlace para actualizar tu contraseña.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <article className="rounded-[30px] border border-[#0071e3]/10 bg-white p-7 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
      <label className="block">
        <span className="text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
          Correo
        </span>
        <input
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 min-h-[3rem] w-full rounded-[18px] border border-[#0071e3]/10 bg-white px-4 text-[0.96rem] text-[#1d1d1f] outline-none focus:border-[#0071e3]/35"
        />
      </label>

      {errorMessage ? (
        <div className="mt-4 rounded-[20px] bg-[#fff1f0] px-4 py-3 text-[0.92rem] text-[#9f2d20]">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-4 rounded-[20px] bg-[#effbf3] px-4 py-3 text-[0.92rem] text-[#237a3c]">
          {successMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-6 inline-flex min-h-[3rem] w-full items-center justify-center rounded-full bg-[#0071e3] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0077ed]"
      >
        {submitting ? 'Enviando enlace...' : 'Enviar enlace'}
      </button>
    </article>
  )
}
