'use client'

import { useMemo, useState } from 'react'

import type { StoreCustomerAddress } from '@/lib/store/customer'
import { supabaseBrowser } from '@/lib/supabase/browser'

type SavedAddressesManagerProps = {
  initialAddresses: StoreCustomerAddress[]
}

type AddressForm = {
  id: number | null
  etiqueta: string
  destinatario: string
  telefono: string
  ciudad: string
  direccion: string
  referencia: string
  is_default: boolean
}

const emptyForm: AddressForm = {
  id: null,
  etiqueta: 'Principal',
  destinatario: '',
  telefono: '',
  ciudad: '',
  direccion: '',
  referencia: '',
  is_default: false,
}

export function SavedAddressesManager({ initialAddresses }: SavedAddressesManagerProps) {
  const [addresses, setAddresses] = useState(initialAddresses)
  const [form, setForm] = useState<AddressForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const hasAddresses = useMemo(() => addresses.length > 0, [addresses.length])

  async function persistAddress() {
    if (submitting) return

    setSubmitting(true)
    setErrorMessage('')

    try {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser()

      if (!user) {
        setErrorMessage('Debes iniciar sesión para guardar direcciones.')
        return
      }

      const payload = {
        auth_user_id: user.id,
        etiqueta: form.etiqueta.trim() || 'Principal',
        destinatario: form.destinatario.trim(),
        telefono: form.telefono.trim(),
        ciudad: form.ciudad.trim(),
        direccion: form.direccion.trim(),
        referencia: form.referencia.trim(),
        is_default: form.is_default,
      }

      if (payload.is_default) {
        const { error: resetError } = await supabaseBrowser
          .from('store_customer_addresses')
          .update({ is_default: false })
          .eq('auth_user_id', user.id)

        if (resetError) throw resetError
      }

      if (form.id) {
        const { data, error } = await supabaseBrowser
          .from('store_customer_addresses')
          .update(payload)
          .eq('id', form.id)
          .select('id,etiqueta,destinatario,telefono,ciudad,direccion,referencia,is_default')
          .single()

        if (error) throw error
        setAddresses((current) =>
          normalizeDefault(
            current.map((address) => (address.id === form.id ? (data as StoreCustomerAddress) : address)),
            (data as StoreCustomerAddress).id,
            (data as StoreCustomerAddress).is_default
          )
        )
      } else {
        const { data, error } = await supabaseBrowser
          .from('store_customer_addresses')
          .insert(payload)
          .select('id,etiqueta,destinatario,telefono,ciudad,direccion,referencia,is_default')
          .single()

        if (error) throw error
        setAddresses((current) =>
          normalizeDefault([data as StoreCustomerAddress, ...current], (data as StoreCustomerAddress).id, (data as StoreCustomerAddress).is_default)
        )
      }

      setForm(emptyForm)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar la dirección.')
    } finally {
      setSubmitting(false)
    }
  }

  async function removeAddress(addressId: number) {
    if (submitting) return

    setSubmitting(true)
    setErrorMessage('')

    try {
      const { error } = await supabaseBrowser
        .from('store_customer_addresses')
        .delete()
        .eq('id', addressId)

      if (error) throw error
      setAddresses((current) => current.filter((address) => address.id !== addressId))
      if (form.id === addressId) {
        setForm(emptyForm)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo eliminar la dirección.')
    } finally {
      setSubmitting(false)
    }
  }

  function startEditing(address: StoreCustomerAddress) {
    setForm({
      id: address.id,
      etiqueta: address.etiqueta,
      destinatario: address.destinatario,
      telefono: address.telefono,
      ciudad: address.ciudad,
      direccion: address.direccion,
      referencia: address.referencia,
      is_default: address.is_default,
    })
    setErrorMessage('')
  }

  return (
    <section className="space-y-6">
      <article className="store-panel rounded-[30px] p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.82rem] font-semibold uppercase tracking-[0.2em] text-[#86868b]">
              Direcciones
            </p>
            <h2 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em] text-[#1d1d1f]">
              Guardadas
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setForm(emptyForm)}
            className="inline-flex min-h-[2.8rem] items-center justify-center rounded-full border border-[#0071e3]/10 bg-white px-4 text-[0.9rem] font-medium text-[#1d1d1f] transition hover:bg-[#f8fbff]"
          >
            Nueva dirección
          </button>
        </div>

        {hasAddresses ? (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {addresses.map((address) => (
              <article
                key={address.id}
                className="rounded-[24px] border border-[#0071e3]/10 bg-[#fbfcff] px-5 py-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[1.02rem] font-semibold text-[#1d1d1f]">
                      {address.etiqueta}
                    </h3>
                    <p className="mt-1 text-[0.9rem] text-[#424245]">{address.destinatario}</p>
                  </div>
                  {address.is_default ? (
                    <span className="rounded-full bg-[#0071e3] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-white">
                      Principal
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 space-y-1 text-[0.92rem] text-[#424245]">
                  <p>{address.telefono || '-'}</p>
                  <p>{address.ciudad || '-'}</p>
                  <p>{address.direccion || '-'}</p>
                  {address.referencia ? <p>{address.referencia}</p> : null}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(address)}
                    className="inline-flex min-h-[2.6rem] items-center justify-center rounded-full border border-[#0071e3]/10 bg-white px-4 text-[0.84rem] font-semibold text-[#1d1d1f]"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAddress(address.id)}
                    className="inline-flex min-h-[2.6rem] items-center justify-center rounded-full border border-[#f0c7c2] bg-white px-4 text-[0.84rem] font-semibold text-[#9f2d20]"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-[#0071e3]/10 bg-[#fbfcff] px-5 py-5">
            <p className="text-[0.96rem] font-semibold text-[#1d1d1f]">Aún no guardaste direcciones.</p>
          </div>
        )}
      </article>

      <article className="store-panel rounded-[30px] p-7">
        <p className="text-[0.82rem] font-semibold uppercase tracking-[0.2em] text-[#86868b]">
          {form.id ? 'Editar' : 'Nueva'}
        </p>
        <h2 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em] text-[#1d1d1f]">
          Dirección
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Etiqueta" value={form.etiqueta} onChange={(value) => setForm((current) => ({ ...current, etiqueta: value }))} />
          <Field label="Destinatario" value={form.destinatario} onChange={(value) => setForm((current) => ({ ...current, destinatario: value }))} />
          <Field label="Celular" value={form.telefono} onChange={(value) => setForm((current) => ({ ...current, telefono: value }))} />
          <Field label="Ciudad" value={form.ciudad} onChange={(value) => setForm((current) => ({ ...current, ciudad: value }))} />
          <Field
            label="Dirección"
            value={form.direccion}
            onChange={(value) => setForm((current) => ({ ...current, direccion: value }))}
            className="md:col-span-2"
          />
          <Field
            label="Referencia"
            value={form.referencia}
            onChange={(value) => setForm((current) => ({ ...current, referencia: value }))}
            className="md:col-span-2"
          />
        </div>

        <label className="mt-4 inline-flex items-center gap-3 text-[0.92rem] text-[#1d1d1f]">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(event) => setForm((current) => ({ ...current, is_default: event.target.checked }))}
          />
          Usar como dirección principal
        </label>

        {errorMessage ? (
          <div className="mt-4 rounded-[20px] bg-[#fff1f0] px-4 py-3 text-[0.92rem] text-[#9f2d20]">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="button"
          onClick={persistAddress}
          disabled={submitting}
          className="mt-6 inline-flex min-h-[3rem] items-center justify-center rounded-full bg-[#0071e3] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0077ed]"
        >
          {submitting ? 'Guardando...' : form.id ? 'Actualizar dirección' : 'Guardar dirección'}
        </button>
      </article>
    </section>
  )
}

function normalizeDefault(addresses: StoreCustomerAddress[], currentId: number, isDefault: boolean) {
  if (!isDefault) {
    return addresses
  }

  return addresses.map((address) => ({
    ...address,
    is_default: address.id === currentId,
  }))
}

function Field({
  label,
  value,
  onChange,
  className = '',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-[3rem] w-full rounded-[18px] border border-[#0071e3]/10 bg-white px-4 text-[0.96rem] text-[#1d1d1f] outline-none focus:border-[#0071e3]/35"
      />
    </label>
  )
}
