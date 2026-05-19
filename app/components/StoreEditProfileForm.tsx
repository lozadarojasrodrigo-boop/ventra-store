'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { supabaseBrowser } from '@/lib/supabase/browser'

type StoreEditProfileFormProps = {
  initialProfile: {
    nombre: string
    apellido: string
    celular: string
    ciudad: string
    correo: string
  }
}

export function StoreEditProfileForm({ initialProfile }: StoreEditProfileFormProps) {
  const router = useRouter()
  const [form, setForm] = useState(initialProfile)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function handleSubmit() {
    if (submitting) return

    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { data: userData, error: userError } = await supabaseBrowser.auth.getUser()
      if (userError || !userData.user) {
        setErrorMessage(userError?.message || 'No se pudo identificar la cuenta.')
        return
      }

      const { error: metadataError } = await supabaseBrowser.auth.updateUser({
        data: {
          first_name: form.nombre,
          last_name: form.apellido,
          full_name: [form.nombre.trim(), form.apellido.trim()].filter(Boolean).join(' '),
          phone: form.celular,
          city: form.ciudad,
        },
      })

      if (metadataError) {
        setErrorMessage(metadataError.message)
        return
      }

      if (form.correo.trim() && form.correo.trim() !== (userData.user.email || '')) {
        const { error: emailError } = await supabaseBrowser.auth.updateUser({
          email: form.correo.trim(),
        })

        if (emailError) {
          setErrorMessage(emailError.message)
          return
        }

        setSuccessMessage('Perfil actualizado. Revisa tu correo para confirmar el nuevo email.')
      } else {
        setSuccessMessage('Perfil actualizado correctamente.')
      }

      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <article className="rounded-[30px] border border-[#0071e3]/10 bg-white p-7 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Nombre"
          value={form.nombre}
          onChange={(value) => setForm((current) => ({ ...current, nombre: value }))}
          placeholder="Tu nombre"
        />
        <Field
          label="Apellido"
          value={form.apellido}
          onChange={(value) => setForm((current) => ({ ...current, apellido: value }))}
          placeholder="Tu apellido"
        />
        <Field
          label="Celular"
          value={form.celular}
          onChange={(value) => setForm((current) => ({ ...current, celular: value }))}
          placeholder="Tu celular"
          type="tel"
        />
        <Field
          label="Ciudad"
          value={form.ciudad}
          onChange={(value) => setForm((current) => ({ ...current, ciudad: value }))}
          placeholder="Tu ciudad"
        />
        <Field
          label="Correo"
          value={form.correo}
          onChange={(value) => setForm((current) => ({ ...current, correo: value }))}
          placeholder="tu@correo.com"
          type="email"
          className="md:col-span-2"
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
        className="mt-6 inline-flex min-h-[3rem] items-center justify-center rounded-full bg-[#0071e3] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0077ed]"
      >
        {submitting ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </article>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 min-h-[3rem] w-full rounded-[18px] border border-[#0071e3]/10 bg-white px-4 text-[0.96rem] text-[#1d1d1f] outline-none focus:border-[#0071e3]/35"
      />
    </label>
  )
}
