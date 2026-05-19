'use client'

import { useState } from 'react'

import type { StoreNotificationPreferences } from '@/lib/store/customer'
import { supabaseBrowser } from '@/lib/supabase/browser'

type NotificationPreferencesFormProps = {
  initialPreferences: StoreNotificationPreferences
}

export function NotificationPreferencesForm({
  initialPreferences,
}: NotificationPreferencesFormProps) {
  const [preferences, setPreferences] = useState(initialPreferences)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  async function savePreferences() {
    if (submitting) return
    setSubmitting(true)
    setMessage('')

    try {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser()

      if (!user) {
        setMessage('Debes iniciar sesión para actualizar tus notificaciones.')
        return
      }

      const { error } = await supabaseBrowser
        .from('store_customer_notification_preferences')
        .upsert({
          auth_user_id: user.id,
          ...preferences,
        })

      if (error) throw error
      setMessage('Preferencias actualizadas.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron guardar los cambios.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <article className="rounded-[30px] border border-[#0071e3]/10 bg-white p-7 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
      <p className="text-[0.82rem] font-semibold uppercase tracking-[0.2em] text-[#86868b]">
        Correos
      </p>
      <h2 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em] text-[#1d1d1f]">
        Notificaciones
      </h2>

      <div className="mt-5 space-y-3">
        <ToggleRow
          label="Pedido recibido"
          checked={preferences.email_order_received}
          onChange={(checked) =>
            setPreferences((current) => ({ ...current, email_order_received: checked }))
          }
        />
        <ToggleRow
          label="Pago en revisión"
          checked={preferences.email_payment_review}
          onChange={(checked) =>
            setPreferences((current) => ({ ...current, email_payment_review: checked }))
          }
        />
        <ToggleRow
          label="Pago confirmado"
          checked={preferences.email_payment_confirmed}
          onChange={(checked) =>
            setPreferences((current) => ({ ...current, email_payment_confirmed: checked }))
          }
        />
        <ToggleRow
          label="Pedido enviado"
          checked={preferences.email_order_sent}
          onChange={(checked) =>
            setPreferences((current) => ({ ...current, email_order_sent: checked }))
          }
        />
        <ToggleRow
          label="Pedido entregado"
          checked={preferences.email_order_delivered}
          onChange={(checked) =>
            setPreferences((current) => ({ ...current, email_order_delivered: checked }))
          }
        />
      </div>

      {message ? (
        <div className="mt-4 rounded-[20px] bg-[#fbfcff] px-4 py-3 text-[0.92rem] text-[#1d1d1f]">
          {message}
        </div>
      ) : null}

      <button
        type="button"
        onClick={savePreferences}
        disabled={submitting}
        className="mt-6 inline-flex min-h-[3rem] items-center justify-center rounded-full bg-[#0071e3] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0077ed]"
      >
        {submitting ? 'Guardando...' : 'Guardar preferencias'}
      </button>
    </article>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-[20px] border border-[#0071e3]/10 bg-[#fbfcff] px-4 py-3">
      <span className="text-[0.96rem] font-semibold text-[#1d1d1f]">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  )
}
