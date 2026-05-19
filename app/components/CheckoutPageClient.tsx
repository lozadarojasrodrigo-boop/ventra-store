'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'

import { useCart } from '@/app/components/CartProvider'
import { StoreFooter } from '@/app/components/StoreFooter'
import { StoreHeader } from '@/app/components/StoreHeader'
import { buildStoreWhatsAppHref } from '@/lib/store/payment-config'
import type { CreateWebOrderResponse, StorePaymentMethod } from '@/lib/store/web-orders'
import { supabaseBrowser } from '@/lib/supabase/browser'

const money = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function CheckoutPageClient() {
  const { hydrated, items, subtotal, clearCart } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<StorePaymentMethod>('qr')
  const [accountEmail, setAccountEmail] = useState('')
  const [customer, setCustomer] = useState({
    nombreCompleto: '',
    telefono: '',
    ciudad: '',
    direccion: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const itemCount = useMemo(() => items.reduce((total, item) => total + item.quantity, 0), [items])

  useEffect(() => {
    let active = true

    function applyUser(user: User | null) {
      if (!active) {
        return
      }

      const firstName =
        typeof user?.user_metadata?.first_name === 'string' ? user.user_metadata.first_name.trim() : ''
      const lastName =
        typeof user?.user_metadata?.last_name === 'string' ? user.user_metadata.last_name.trim() : ''
      const fullName =
        [firstName, lastName].filter(Boolean).join(' ') ||
        (typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name.trim() : '')
      const phone =
        typeof user?.user_metadata?.phone === 'string' ? user.user_metadata.phone.trim() : ''
      const city =
        typeof user?.user_metadata?.city === 'string' ? user.user_metadata.city.trim() : ''

      setAccountEmail(user?.email || '')
      setCustomer((current) => ({
        ...current,
        nombreCompleto: current.nombreCompleto || fullName,
        telefono: current.telefono || phone,
        ciudad: current.ciudad || city,
      }))

      if (!user) {
        return
      }

      supabaseBrowser
        .from('store_customer_addresses')
        .select('destinatario,telefono,ciudad,direccion,referencia,is_default')
        .eq('auth_user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (!data || !active) {
            return
          }

          setCustomer((current) => ({
            ...current,
            nombreCompleto: current.nombreCompleto || data.destinatario || fullName,
            telefono: current.telefono || data.telefono || phone,
            ciudad: current.ciudad || data.ciudad || city,
            direccion:
              current.direccion ||
              [data.direccion, data.referencia].filter(Boolean).join(' · '),
          }))
        })
    }

    supabaseBrowser.auth.getUser().then(({ data }) => {
      applyUser(data.user ?? null)
    })

    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit() {
    if (submitting) return

    setErrorMessage('')
    setSubmitting(true)

    try {
      const response = await fetch('/api/web-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          customer,
          accountEmail,
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      })

      const result = (await response.json()) as CreateWebOrderResponse

      if (!response.ok || !result.ok) {
        setErrorMessage(result.ok ? 'No se pudo registrar el pedido.' : result.error)
        return
      }

      const whatsappHref = buildStoreWhatsAppHref({
        paymentMethod,
        total: subtotal,
        customerName: customer.nombreCompleto,
        orderCode: result.orderCode,
        city: customer.ciudad,
        address: customer.direccion,
        items: items.map((item) => ({
          nombre: item.nombre,
          quantity: item.quantity,
        })),
      })

      clearCart()
      window.location.href = whatsappHref
    } catch {
      setErrorMessage('No se pudo enviar el pedido. Intenta otra vez.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
        <section className="mx-auto max-w-[1440px] px-4 py-10 md:px-8 xl:px-12">
          <div className="rounded-[28px] border border-[#0071e3]/10 bg-white p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <p className="text-[1rem] font-semibold text-[#1d1d1f]">Cargando checkout...</p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <StoreHeader
        utilitySlot={
          <Link
            href="/carrito"
            className="inline-flex min-h-[2.7rem] items-center justify-center rounded-full px-4 text-[0.92rem] font-medium text-[#1d1d1f] transition hover:bg-black/4"
          >
            Volver al carrito
          </Link>
        }
      />

      <section className="store-shell py-6">
        <div className="text-center">
          <p className="text-[0.86rem] font-semibold uppercase tracking-[0.22em] text-[#86868b]">
            Checkout
          </p>
          <h1 className="mt-3 text-[2.35rem] font-semibold tracking-[-0.05em] text-[#1d1d1f] md:text-[4.2rem]">
            Completa tu pedido
          </h1>
          <p className="mx-auto mt-4 max-w-[34rem] text-[0.98rem] leading-8 text-[#424245]">
            Te llevaremos directo a WhatsApp con tu pedido listo para coordinar pago y entrega.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="mt-8 rounded-[28px] border border-[#0071e3]/10 bg-white p-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <p className="text-[1rem] font-semibold text-[#1d1d1f]">No hay productos para pagar.</p>
            <p className="mx-auto mt-3 max-w-[34rem] text-[0.98rem] leading-8 text-[#424245]">
              Añade productos al carrito y luego vuelve aquí para preparar el cierre de compra.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex min-h-[3rem] items-center justify-center rounded-full bg-[#0071e3] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0077ed]"
            >
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <aside className="rounded-[28px] border border-[#0071e3]/10 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-[#86868b]">
                Resumen
              </p>
              <h2 className="mt-3 text-[1.8rem] font-semibold tracking-[-0.04em] text-[#1d1d1f]">
                Tu compra
              </h2>
              <div className="mt-5 space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-[20px] border border-[#0071e3]/10 bg-white px-4 py-3.5"
                  >
                    <div>
                      <p className="text-[0.98rem] font-semibold text-[#1d1d1f]">{item.nombre}</p>
                      <p className="mt-1 text-[0.82rem] text-[#6e6e73]">
                        {item.quantity} x {money.format(item.precio_venta)}
                      </p>
                    </div>
                    <p className="text-[1rem] font-semibold text-[#1d1d1f]">
                      {money.format(item.quantity * item.precio_venta)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                <SummaryRow label="Items" value={String(itemCount)} />
                <SummaryRow label="Subtotal" value={money.format(subtotal)} />
                <SummaryRow label="Entrega" value="Domicilio" />
              </div>

              <div className="mt-6 rounded-[24px] bg-[#0071e3] px-5 py-5 text-white">
                <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-white">
                  Total
                </p>
                <p className="mt-2 text-[2.35rem] font-semibold tracking-[-0.04em]">
                  {money.format(subtotal)}
                </p>
              </div>
            </aside>

            <section>
              <article className="rounded-[28px] border border-[#0071e3]/10 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
                <h2 className="text-[1.8rem] font-semibold tracking-[-0.04em] text-[#1d1d1f]">
                  Datos y pago
                </h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Field
                    label="Nombre completo"
                    placeholder="Tu nombre"
                    value={customer.nombreCompleto}
                    onChange={(value) =>
                      setCustomer((current) => ({ ...current, nombreCompleto: value }))
                    }
                  />
                  <Field
                    label="Teléfono"
                    placeholder="Tu teléfono"
                    value={customer.telefono}
                    onChange={(value) => setCustomer((current) => ({ ...current, telefono: value }))}
                  />
                  <Field
                    label="Ciudad"
                    placeholder="Tu ciudad"
                    value={customer.ciudad}
                    onChange={(value) => setCustomer((current) => ({ ...current, ciudad: value }))}
                  />
                  <Field
                    label="Dirección de entrega"
                    placeholder="Barrio, calle, referencia"
                    value={customer.direccion}
                    onChange={(value) => setCustomer((current) => ({ ...current, direccion: value }))}
                  />
                </div>

                {accountEmail ? (
                  <div className="mt-4 rounded-[20px] border border-[#0071e3]/10 bg-[#fbfcff] px-4 py-4 text-[0.92rem] text-[#424245]">
                    Tu cuenta está conectada como{' '}
                    <span className="font-semibold text-[#1d1d1f]">{accountEmail}</span>. Este
                    pedido quedará asociado a tu historial.
                  </div>
                ) : null}

                <div className="mt-7 border-t border-[#0071e3]/10 pt-7">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-[#86868b]">
                        Forma de pago
                      </p>
                      <h3 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.04em] text-[#1d1d1f]">
                        Elige cómo pagar
                      </h3>
                    </div>
                    <p className="text-[0.92rem] text-[#424245]">Total {money.format(subtotal)}</p>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <PaymentChoice
                      title="QR"
                      active={paymentMethod === 'qr'}
                      onClick={() => setPaymentMethod('qr')}
                      text="Solicitar QR"
                    />
                    <PaymentChoice
                      title="Transferencia"
                      active={paymentMethod === 'transferencia'}
                      onClick={() => setPaymentMethod('transferencia')}
                      text="Solicitar cuenta"
                    />
                    <PaymentChoice
                      title="Efectivo"
                      active={paymentMethod === 'efectivo'}
                      onClick={() => setPaymentMethod('efectivo')}
                      text="Coordinar entrega"
                    />
                  </div>

                  <p className="mt-5 text-[0.92rem] leading-8 text-[#424245]">
                    {paymentMethod === 'qr'
                      ? 'Te enviaremos a WhatsApp para solicitar tu QR con el pedido ya preparado.'
                      : paymentMethod === 'transferencia'
                        ? 'Te enviaremos a WhatsApp para solicitar la cuenta bancaria con el pedido ya preparado.'
                        : 'Te enviaremos a WhatsApp para coordinar envío a domicilio y pago en efectivo.'}
                  </p>

                  {errorMessage ? (
                    <div className="mt-4 rounded-[20px] bg-[#fff1f0] px-4 py-3 text-left text-[0.92rem] text-[#9f2d20]">
                      {errorMessage}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || items.length === 0}
                    className="mt-6 inline-flex min-h-[3.15rem] w-full items-center justify-center rounded-full bg-[#0071e3] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0077ed]"
                  >
                    {submitting ? 'Preparando compra...' : 'Realizar compra'}
                  </button>
                </div>
              </article>
            </section>
          </div>
        )}
      </section>

      <StoreFooter />
    </main>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[22px] border border-[#0071e3]/10 bg-white px-4 py-3">
      <span className="text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-[#86868b]">
        {label}
      </span>
      <span className="text-[0.98rem] font-semibold text-[#1d1d1f]">{value}</span>
    </div>
  )
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
        {label}
      </span>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-[3rem] w-full rounded-[18px] border border-[#0071e3]/10 bg-white px-4 text-[0.96rem] text-[#1d1d1f] outline-none focus:border-[#0071e3]/35"
      />
    </label>
  )
}

function PaymentChoice({
  title,
  text,
  active,
  onClick,
}: {
  title: string
  text: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[20px] px-4 py-4 text-left ${
        active
          ? 'border border-[#0071e3] bg-[#0071e3] text-white'
          : 'border border-[#0071e3]/10 bg-white text-[#1d1d1f] hover:bg-[#f8fbff]'
      }`}
    >
      <p
        className={`text-[0.82rem] font-semibold uppercase tracking-[0.16em] ${
          active ? 'text-white' : 'text-[#86868b]'
        }`}
      >
        Método
      </p>
      <p className="mt-2 text-[1rem] font-semibold">{title}</p>
      <p className={`mt-1.5 text-[0.88rem] leading-6 ${active ? 'text-white' : 'text-[#424245]'}`}>
        {text}
      </p>
    </button>
  )
}
