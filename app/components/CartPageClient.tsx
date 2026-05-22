'use client'

import Link from 'next/link'

import { StoreFooter } from '@/app/components/StoreFooter'
import { StoreHeader } from '@/app/components/StoreHeader'
import { useCart } from '@/app/components/CartProvider'

const money = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function CartPageClient() {
  const { items, subtotal, removeItem, updateQuantity, clearCart, hydrated } = useCart()

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <StoreHeader />

      <section className="store-section mx-auto max-w-[1440px] px-3 py-4 md:px-6 md:py-5 xl:px-12">
        <div className="text-center">
          <p className="text-[0.86rem] font-semibold uppercase tracking-[0.22em] text-[#86868b]">
            Tu carrito
          </p>
          <h1 className="mt-2.5 text-[2rem] font-semibold tracking-[-0.05em] text-[#1d1d1f] md:mt-3 md:text-[4.6rem]">
            Revisa tu compra
          </h1>
          <p className="mx-auto mt-4 max-w-[42rem] text-[1rem] leading-8 text-[#424245]">
            Ajusta cantidades, revisa precios y continúa al checkout cuando tu pedido esté listo.
          </p>
        </div>

        <div className="mt-5 flex justify-center">
          {items.length > 0 ? (
            <button
              type="button"
              onClick={clearCart}
              className="inline-flex min-h-[2.8rem] items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-[#0071e3] transition hover:bg-[#0071e3]/8"
            >
              Vaciar carrito
            </button>
          ) : null}
        </div>

        {!hydrated ? (
          <div className="mt-8 rounded-[28px] border border-[#0071e3]/10 bg-white p-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <p className="text-[1rem] font-semibold text-[#1d1d1f]">Cargando carrito...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-[28px] border border-[#0071e3]/10 bg-white p-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <p className="text-[1rem] font-semibold text-[#1d1d1f]">Tu carrito está vacío.</p>
            <p className="mx-auto mt-3 max-w-[34rem] text-[0.98rem] leading-8 text-[#424245]">
              Sigue explorando el catálogo y añade productos para preparar tu pedido.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex min-h-[3rem] items-center justify-center rounded-full bg-[#0071e3] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0077ed]"
            >
              Volver al catálogo
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-4 rounded-[20px] border border-[#0071e3]/10 bg-white p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] md:grid-cols-[8.5rem_1fr] md:gap-5 md:rounded-[30px] md:p-5"
                >
                  <div className="overflow-hidden rounded-[24px] bg-[#f5f5f7]">
                    {item.imagen_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imagen_url}
                        alt={item.nombre}
                        className="aspect-square h-full w-full object-contain object-center p-3"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center px-4 text-center text-[0.82rem] text-[#6e6e73]">
                        Imagen pendiente
                      </div>
                    )}
                  </div>

                  <div className="space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#f5f5f7] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">
                            {item.categoria || 'General'}
                          </span>
                          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">
                            {item.sku || 'Sin SKU'}
                          </span>
                        </div>
                        <h2 className="mt-3 text-[1.14rem] font-semibold tracking-[-0.02em] text-[#1d1d1f]">
                          {item.nombre}
                        </h2>
                        <p className="mt-1 text-[0.84rem] text-[#424245]">Disponible para tu pedido</p>
                      </div>
                      <p className="text-[1.28rem] font-semibold tracking-[-0.02em] text-[#1d1d1f]">
                        {money.format(item.precio_venta)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-full bg-[#f5f5f7] p-1.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, Math.max(item.quantity - 1, 1))}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-base font-semibold text-[#1d1d1f]"
                        >
                          -
                        </button>
                        <span className="inline-flex min-w-[2.4rem] items-center justify-center text-sm font-semibold text-[#1d1d1f]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, Math.min(item.quantity + 1, item.stock_actual))
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-base font-semibold text-[#1d1d1f]"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <p className="text-[0.96rem] font-semibold text-[#1d1d1f]">
                          Total {money.format(item.precio_venta * item.quantity)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="rounded-full px-3 py-1.5 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-[#0071e3] transition hover:bg-[#0071e3]/8"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="rounded-[20px] border border-[#0071e3]/10 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)] md:rounded-[30px] md:p-7">
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-[#86868b]">
                Resumen
              </p>
              <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[#1d1d1f]">
                Tu pedido
              </h2>
              <div className="mt-5 space-y-3">
                <Row label="Items" value={String(items.reduce((sum, item) => sum + item.quantity, 0))} />
                <Row label="Subtotal" value={money.format(subtotal)} />
                <Row label="Pago" value="QR / Transfer / Cash" />
              </div>

              <div className="mt-6 rounded-[28px] bg-[#0071e3] p-5 text-white">
                <p className="text-[0.74rem] font-semibold uppercase tracking-[0.2em] text-white">
                  Total estimado
                </p>
                <p className="mt-2 text-[2.35rem] font-semibold tracking-[-0.04em]">
                  {money.format(subtotal)}
                </p>
                <p className="mt-2 text-[0.92rem] leading-7 text-white">
                  Continúa al checkout para registrar tu pedido y completar la compra por WhatsApp.
                </p>
              </div>

              <Link
                href="/checkout"
                className="mt-6 inline-flex min-h-[3.2rem] w-full items-center justify-center rounded-full bg-[#0071e3] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0077ed] hover:text-white"
              >
                Continuar al checkout
              </Link>
            </aside>
          </div>
        )}
      </section>

      <StoreFooter />
    </main>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[#0071e3]/10 bg-white px-4 py-3">
      <span className="text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-[#86868b]">
        {label}
      </span>
      <span className="text-[0.98rem] font-semibold text-[#1d1d1f]">{value}</span>
    </div>
  )
}
