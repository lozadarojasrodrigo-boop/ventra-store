'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { BOLIVIA_CITY_OPTIONS } from '@/lib/store/cities'
import { supabaseBrowser } from '@/lib/supabase/browser'

type AuthMode = 'signin' | 'signup'

export function StoreAuthPanel() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function handleSubmit() {
    if (submitting) return

    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setErrorMessage('Las contraseñas no coinciden.')
          return
        }

        if (password.length < 6) {
          setErrorMessage('La contraseña debe tener al menos 6 caracteres.')
          return
        }

        const { data, error } = await supabaseBrowser.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              full_name: [firstName.trim(), lastName.trim()].filter(Boolean).join(' '),
              phone,
              city,
            },
          },
        })

        if (error) {
          setErrorMessage(error.message)
          return
        }

        const createdUserId = data.user?.id
        if (createdUserId) {
          await fetch('/api/auth/welcome', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: createdUserId,
              email,
              firstName,
              lastName,
            }),
          }).catch(() => undefined)
        }

        if (!data.session) {
          setSuccessMessage('Cuenta creada. Revisa tu correo para confirmar el acceso.')
          return
        }

        router.push('/cuenta')
        router.refresh()
        return
      }

      const { error } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMessage(error.message)
        return
      }

      router.push('/cuenta')
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <article className="rounded-[30px] border border-[#0071e3]/10 bg-white p-7 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`inline-flex min-h-[2.85rem] items-center justify-center rounded-full px-4 text-[0.92rem] font-semibold transition ${
            mode === 'signin'
              ? 'bg-[#0071e3] text-white'
              : 'border border-[#0071e3]/10 bg-white text-[#1d1d1f] hover:bg-[#f8fbff]'
          }`}
        >
          Ingresar
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`inline-flex min-h-[2.85rem] items-center justify-center rounded-full px-4 text-[0.92rem] font-semibold transition ${
            mode === 'signup'
              ? 'bg-[#0071e3] text-white'
              : 'border border-[#0071e3]/10 bg-white text-[#1d1d1f] hover:bg-[#f8fbff]'
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {mode === 'signup' ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre" placeholder="Tu nombre" value={firstName} onChange={setFirstName} />
            <Field label="Apellido" placeholder="Tu apellido" value={lastName} onChange={setLastName} />
            <Field label="Celular" placeholder="Tu celular" value={phone} onChange={setPhone} type="tel" />
            <SelectField
              label="Ciudad"
              value={city}
              onChange={setCity}
              options={BOLIVIA_CITY_OPTIONS}
              placeholder="Selecciona tu ciudad"
            />
          </div>
        ) : null}
        <Field
          label="Correo"
          placeholder="tu@correo.com"
          value={email}
          onChange={setEmail}
          type="email"
        />
        <Field
          label="Contraseña"
          placeholder="Tu contraseña"
          value={password}
          onChange={setPassword}
          type="password"
        />
        {mode === 'signup' ? (
          <Field
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChange={setConfirmPassword}
            type="password"
          />
        ) : null}
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
        {submitting
          ? mode === 'signin'
            ? 'Ingresando...'
            : 'Creando cuenta...'
          : mode === 'signin'
            ? 'Ingresar'
            : 'Crear cuenta'}
      </button>

      {mode === 'signin' ? (
        <div className="mt-4 text-right">
          <Link
            href="/recuperar"
            className="text-[0.88rem] font-medium text-[#0071e3] transition hover:text-[#0077ed]"
          >
            Olvidé mi contraseña
          </Link>
        </div>
      ) : null}
    </article>
  )
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label className="block">
      <span className="text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
        {label}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-[3rem] w-full rounded-[18px] border border-[#0071e3]/10 bg-white px-4 text-[0.96rem] text-[#1d1d1f] outline-none focus:border-[#0071e3]/35"
      />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  placeholder: string
}) {
  return (
    <label className="block">
      <span className="text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-[3rem] w-full appearance-none rounded-[18px] border border-[#0071e3]/10 bg-white px-4 text-[0.96rem] text-[#1d1d1f] outline-none focus:border-[#0071e3]/35"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
