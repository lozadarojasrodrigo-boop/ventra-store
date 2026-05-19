'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { supabaseBrowser } from '@/lib/supabase/browser'

export function StoreResetPasswordPanel() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [ready, setReady] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let active = true
    supabaseBrowser.auth.getSession().then(() => {
      if (active) {
        setReady(true)
      }
    })
    return () => {
      active = false
    }
  }, [])

  async function handleSubmit() {
    if (submitting) return

    setErrorMessage('')
    setSuccessMessage('')

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabaseBrowser.auth.updateUser({
        password,
      })

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setSuccessMessage('Tu contraseña ya fue actualizada.')
      window.setTimeout(() => {
        router.push('/cuenta')
        router.refresh()
      }, 900)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <article className="rounded-[30px] border border-[#0071e3]/10 bg-white p-7 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
      {!ready ? (
        <p className="text-[0.96rem] text-[#424245]">Preparando acceso seguro...</p>
      ) : (
        <>
          <div className="space-y-4">
            <Field
              label="Nueva contraseña"
              value={password}
              onChange={setPassword}
              placeholder="Nueva contraseña"
            />
            <Field
              label="Confirmar contraseña"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Repite tu contraseña"
            />
          </div>

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
            {submitting ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </>
      )}
    </article>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="block">
      <span className="text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
        {label}
      </span>
      <input
        type="password"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-[3rem] w-full rounded-[18px] border border-[#0071e3]/10 bg-white px-4 text-[0.96rem] text-[#1d1d1f] outline-none focus:border-[#0071e3]/35"
      />
    </label>
  )
}
