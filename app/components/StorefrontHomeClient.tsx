'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'

import { AddToCartButton } from './AddToCartButton'
import { StoreFooter } from './StoreFooter'
import { StoreHeader } from './StoreHeader'
import { StoreSearchBox } from './StoreSearchBox'
import { type StoreProduct } from '@/lib/store/products'

const money = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

type StorefrontHomeClientProps = {
  products: StoreProduct[]
}

export function StorefrontHomeClient({ products }: StorefrontHomeClientProps) {
  const router = useRouter()
  const categories = useMemo(
    () =>
      Array.from(new Set(products.map((product) => (product.categoria || 'General').trim()))).slice(
        0,
        6
      ),
    [products]
  )

  const heroProducts = products.slice(0, 3)
  const filteredProducts = products.slice(0, 8)

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <StoreHeader
        navLinks={[
          { href: '#destacados', label: 'Nuevos' },
          { href: '#catalogo', label: 'Catálogo' },
          { href: '#categorias', label: 'Categorías' },
          { href: '#pagos', label: 'Pagos' },
        ]}
        searchSlot={<StoreSearchBox products={products} />}
      />

      <section className="store-section store-shell pt-4 md:pt-6">
        <div className="text-center">
          <p className="text-[0.84rem] font-semibold uppercase tracking-[0.22em] text-[#86868b]">
            VENTRA Store
          </p>
          <h1 className="mx-auto mt-2.5 max-w-[12ch] text-[2.15rem] font-semibold leading-[0.96] tracking-[-0.05em] text-[#1d1d1f] md:mt-3 md:text-[5.2rem]">
            Productos nuevos.
            <br />
            Compra directa.
          </h1>
        </div>
      </section>

      <section
        id="destacados"
        className="store-section store-delay-1 store-shell py-4 md:py-6"
      >
        <div className="space-y-4">
          {heroProducts[0] ? (
            <HeroShowcase
              product={heroProducts[0]}
              eyebrow="Nuevo"
              subtitle="Disponible"
            />
          ) : null}
          {heroProducts[1] ? (
            <HeroShowcase
              product={heroProducts[1]}
              eyebrow="Recomendado"
              subtitle="Disponible"
            />
          ) : null}
          {heroProducts[2] ? (
            <HeroShowcase
              product={heroProducts[2]}
              eyebrow="Destacado"
              subtitle="Disponible"
            />
          ) : null}
        </div>
      </section>

      <section
        id="categorias"
        className="store-section store-delay-2 store-shell py-3.5 md:py-4"
      >
        <div className="rounded-[22px] border border-[#0071e3]/10 bg-white px-4 py-5 text-center shadow-[0_10px_30px_rgba(0,0,0,0.04)] md:rounded-[30px] md:px-8 md:py-7">
          <p className="text-[0.82rem] font-semibold uppercase tracking-[0.2em] text-[#86868b]">
            Categorías
          </p>
          <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[#1d1d1f] md:text-[3rem]">
            Explora por sección
          </h2>
          <div className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3 md:mt-7 md:gap-3">
            {categories.map((category, index) => (
              <button
                key={category}
                type="button"
                onClick={() => router.push(`/buscar?q=${encodeURIComponent(category)}`)}
                className={`group rounded-[18px] border border-[#0071e3]/12 bg-white px-4 py-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-[#0071e3]/28 hover:bg-[#f7fbff] md:rounded-[22px] md:px-5 md:py-5 ${
                  index === 0 ? 'sm:col-span-2 xl:col-span-1' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-[1.12rem] font-semibold tracking-[-0.02em] text-[#1d1d1f] md:text-[1.22rem]">
                    {category}
                  </h3>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f7fbff] text-[#0071e3] transition group-hover:bg-[#0071e3] group-hover:text-white">
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </span>
                </div>
                <p className="mt-3 text-[0.9rem] leading-7 text-[#6e6e73]">
                  Explorar
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section
        id="catalogo"
        className="store-section store-delay-3 store-shell py-3.5 pb-8 md:py-4 md:pb-10"
      >
        <div className="text-center">
          <p className="text-[0.84rem] font-semibold uppercase tracking-[0.22em] text-[#86868b]">
            Catálogo
          </p>
          <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[#1d1d1f] md:text-[3.2rem]">
            Compra desde el catálogo
          </h2>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="mt-8 rounded-[28px] border border-[#0071e3]/10 bg-white px-8 py-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <p className="text-[1.05rem] font-semibold text-[#1d1d1f]">No encontramos resultados.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:mt-8 md:gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <StoreGridCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section
        id="pagos"
        className="store-section store-delay-4 store-shell pb-8 md:pb-12"
      >
        <article className="rounded-[22px] border border-[#0071e3]/10 bg-white px-4 py-5 text-center shadow-[0_10px_30px_rgba(0,0,0,0.04)] md:rounded-[30px] md:px-10 md:py-8">
          <p className="text-[0.84rem] font-semibold uppercase tracking-[0.22em] text-[#86868b]">
            Formas de pago
          </p>
          <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[#1d1d1f] md:text-[3rem]">
            QR y transferencia
          </h2>
          <div className="mt-5 grid gap-3 md:mt-8 md:gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              <PaymentCard
                title="QR"
                text="Paga en segundos con QR, comparte tu comprobante y deja tu pedido listo para confirmar."
                icon="qr"
              />
              <PaymentCard
                title="Transferencia"
                text="Recibe los datos bancarios, transfiere con tranquilidad y confirma tu compra por WhatsApp."
                icon="bank"
              />
            </div>
            <PaymentVisualPanel />
          </div>
        </article>
      </section>

      <StoreFooter />
    </main>
  )
}

function getStoreStatusMeta(status: StoreProduct['estado_publicacion']) {
  switch (status) {
    case 'agotado':
      return { label: 'Agotado', canBuy: false }
    case 'proximamente':
      return { label: 'Próximamente', canBuy: false }
    default:
      return { label: 'Disponible', canBuy: true }
  }
}

function HeroShowcase({
  product,
  eyebrow,
  subtitle,
}: {
  product: StoreProduct
  eyebrow: string
  subtitle: string
}) {
  const statusMeta = getStoreStatusMeta(product.estado_publicacion)

  return (
    <article className="overflow-hidden rounded-[32px] border border-[#0071e3]/10 bg-white text-center shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
      <div className="px-6 pt-9 md:px-10">
        <p className="text-[0.84rem] font-semibold uppercase tracking-[0.22em] text-[#86868b]">
          {eyebrow}
        </p>
        <h2 className="mx-auto mt-3 max-w-[12ch] text-[2.35rem] font-semibold leading-[0.95] tracking-[-0.05em] md:text-[4.5rem]">
          {product.nombre || 'Producto'}
        </h2>
        <p className="mt-3 text-[1rem] leading-8 text-[#424245] md:text-[1.16rem]">
          {statusMeta.label === 'Disponible' ? subtitle : statusMeta.label}
        </p>
        <p className="mx-auto mt-3 max-w-[38rem] text-[0.98rem] leading-8 text-[#424245]">
          {product.categoria || 'Colección general'} · {product.sku || 'Edición disponible'} ·{' '}
          {money.format(Number(product.precio_venta || 0))}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={`/producto/${product.id}`}
            className="inline-flex min-h-[3rem] items-center justify-center rounded-full bg-[#0071e3] px-6 py-3 text-sm font-semibold !text-white transition hover:bg-[#0077ed]"
            style={{ color: '#ffffff' }}
          >
            Características
          </Link>
          <AddToCartButton
            product={{
              id: product.id,
              nombre: product.nombre || 'Producto',
              precio_venta: Number(product.precio_venta || 0),
              imagen_url: product.imagen_url,
              sku: product.sku,
              categoria: product.categoria,
              stock_actual: Number(product.stock_actual || 0),
            }}
            redirectToCart
            disabled={!statusMeta.canBuy}
            className="inline-flex min-h-[3rem] items-center justify-center rounded-full border border-[#0071e3] px-6 py-3 text-sm font-semibold text-[#0071e3] transition hover:border-[#0071e3] hover:bg-[#0071e3] hover:text-white"
          >
            {statusMeta.canBuy ? 'Comprar' : statusMeta.label}
          </AddToCartButton>
        </div>
      </div>

      <div className="mt-8 px-4 pb-4 md:px-8 md:pb-8">
        <ProductImage
          product={product}
          className="aspect-[2.3/1] w-full rounded-[26px]"
          fit="contain"
          padded
        />
      </div>
    </article>
  )
}

function StoreGridCard({ product }: { product: StoreProduct }) {
  const statusMeta = getStoreStatusMeta(product.estado_publicacion)

  return (
    <article className="overflow-hidden rounded-[24px] border border-[#0071e3]/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
      <ProductImage product={product} className="aspect-[1/1] w-full" fit="contain" padded />
      <div className="px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
            {product.categoria || 'General'}
          </span>
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
            {product.sku || 'Sin SKU'}
          </span>
        </div>
        <h3 className="mt-3 text-[1.18rem] font-semibold tracking-[-0.02em] text-[#1d1d1f]">
          {product.nombre || 'Producto'}
        </h3>
        <p className="mt-2 text-[0.92rem] text-[#424245]">{statusMeta.label}</p>
        <p className="mt-4 text-[1.3rem] font-semibold text-[#1d1d1f]">
          {money.format(Number(product.precio_venta || 0))}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/producto/${product.id}`}
            className="inline-flex min-h-[2.8rem] items-center justify-center rounded-full bg-[#0071e3] px-4 py-2 text-[0.82rem] font-semibold !text-white transition hover:bg-[#0077ed]"
            style={{ color: '#ffffff' }}
          >
            Características
          </Link>
          <AddToCartButton
            product={{
              id: product.id,
              nombre: product.nombre || 'Producto',
              precio_venta: Number(product.precio_venta || 0),
              imagen_url: product.imagen_url,
              sku: product.sku,
              categoria: product.categoria,
              stock_actual: Number(product.stock_actual || 0),
            }}
            redirectToCart
            disabled={!statusMeta.canBuy}
            className="inline-flex min-h-[2.8rem] items-center justify-center rounded-full border border-[#0071e3] px-4 py-2 text-[0.82rem] font-semibold text-[#0071e3] transition hover:border-[#0071e3] hover:bg-[#0071e3] hover:text-white"
          >
            {statusMeta.canBuy ? 'Comprar' : statusMeta.label}
          </AddToCartButton>
        </div>
      </div>
    </article>
  )
}

function PaymentCard({
  title,
  text,
  icon,
}: {
  title: string
  text: string
  icon: 'qr' | 'bank'
}) {
  return (
    <div className="rounded-[24px] border border-[#0071e3]/10 bg-white px-5 py-6">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#f7fbff] text-[#0071e3]">
        {icon === 'qr' ? <QrIcon /> : <BankIcon />}
      </div>
      <p className="text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
        {title}
      </p>
      <p className="mt-3 text-[1rem] leading-7 text-[#424245]">{text}</p>
    </div>
  )
}

function PaymentVisualPanel() {
  return (
    <div className="overflow-hidden rounded-[26px] border border-[#0071e3]/10 bg-[#f7fbff] text-left">
      <div className="px-6 py-6 md:px-7 md:py-7">
        <p className="text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-[#6e6e73]">
          Pago confirmado
        </p>
        <h3 className="mt-3 text-[1.6rem] font-semibold tracking-[-0.03em] text-[#1d1d1f] md:text-[2.1rem]">
          Compra más rápida,
          <br />
          confirmación más clara.
        </h3>
        <p className="mt-3 max-w-[30rem] text-[0.98rem] leading-8 text-[#424245]">
          Elige QR o transferencia, envía tu comprobante y te confirmamos tu pedido para seguir con la entrega.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <TrustStep title="Paso 1" text="Haz tu pedido" />
          <TrustStep title="Paso 2" text="Envía tu comprobante" />
          <TrustStep title="Paso 3" text="Recibe tu compra" />
        </div>
      </div>
    </div>
  )
}

function TrustStep({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[18px] border border-[#0071e3]/10 bg-white px-4 py-4">
      <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[#0071e3]">{title}</p>
      <p className="mt-2 text-[0.96rem] font-semibold text-[#1d1d1f]">{text}</p>
    </div>
  )
}

function QrIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4.5 4.5h5v5h-5z" />
      <path d="M14.5 4.5h5v5h-5z" />
      <path d="M4.5 14.5h5v5h-5z" />
      <path d="M14.5 14.5v2.5" />
      <path d="M19.5 14.5v5" />
      <path d="M14.5 19.5h2.5" />
      <path d="M17 17h2.5" />
    </svg>
  )
}

function BankIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 9 12 4.5 20.5 9" />
      <path d="M5.5 9.5h13" />
      <path d="M6.5 10v7.5" />
      <path d="M11.5 10v7.5" />
      <path d="M16.5 10v7.5" />
      <path d="M4 19.5h16" />
    </svg>
  )
}

function ProductImage({
  product,
  className,
  fit = 'cover',
  padded = false,
}: {
  product: StoreProduct
  className: string
  fit?: 'cover' | 'contain'
  padded?: boolean
}) {
  return (
    <div className={`overflow-hidden bg-[#f5f5f7] ${className}`}>
      {product.imagen_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imagen_url}
          alt={product.nombre || 'Producto'}
          className={`store-image h-full w-full ${
            fit === 'contain' ? 'object-contain object-center' : 'object-cover object-center'
          } ${padded ? 'p-3 md:p-5' : ''}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-6 text-center text-[0.9rem] text-[#6e6e73]">
          Imagen pendiente
        </div>
      )}
    </div>
  )
}
