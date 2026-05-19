import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AddToCartButton } from '../../components/AddToCartButton'
import { FavoriteToggleButton } from '../../components/FavoriteToggleButton'
import { StoreReviewForm } from '../../components/StoreReviewForm'
import { StoreFooter } from '@/app/components/StoreFooter'
import { StoreHeader } from '@/app/components/StoreHeader'
import { getFavoriteProductIdsForUser, getReviewsForProduct } from '@/lib/store/customer'
import { getStoreProductById, getStoreProducts } from '@/lib/store/products'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const money = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

type ProductPageProps = {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const productId = Number(id)

  if (!Number.isInteger(productId) || productId <= 0) {
    notFound()
  }

  const product = await getStoreProductById(productId)

  if (!product) {
    notFound()
  }

  const products = await getStoreProducts()
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const relatedProducts = products
    .filter((candidate) => candidate.id !== product.id)
    .filter((candidate) =>
      product.categoria ? candidate.categoria === product.categoria : true
    )
    .slice(0, 4)

  const productFeatures = (product.caracteristicas || '')
    .split(/\r?\n/)
    .map((feature) => feature.trim())
    .filter(Boolean)
  const availabilityLabel = Number(product.stock_actual || 0) > 0 ? 'Disponible' : 'Agotado'
  const favoriteIds = user ? await getFavoriteProductIdsForUser(user.id) : []
  const isFavorite = favoriteIds.includes(product.id)
  const reviews = await getReviewsForProduct(product.id)

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <StoreHeader
        utilitySlot={
          <Link
            href="/"
            className="inline-flex min-h-[2.9rem] items-center justify-center rounded-full px-4 text-[0.95rem] font-medium text-[#1d1d1f] transition hover:bg-black/4"
          >
            Volver
          </Link>
        }
      />

      <section className="store-section store-shell py-6">
        <div className="text-center">
          <h1 className="text-[2.5rem] font-semibold leading-[0.95] tracking-[-0.05em] text-[#1d1d1f] md:text-[5rem]">
            {product.nombre || 'Producto'}
          </h1>
        </div>

        <div className="mt-8 space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
            <article className="store-surface overflow-hidden rounded-[34px] border border-[#0071e3]/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <div className="border-b border-[#0071e3]/10 px-6 py-5 md:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{product.categoria || 'General'}</Badge>
                    <Badge>{product.sku || 'Sin SKU'}</Badge>
                  </div>
                  <p className="text-[0.92rem] text-[#6e6e73]">{availabilityLabel}</p>
                </div>
                <div className="mt-4">
                  <FavoriteToggleButton
                    productId={product.id}
                    initialActive={isFavorite}
                    className="inline-flex min-h-[2.7rem] items-center justify-center rounded-full border border-[#0071e3]/10 bg-white px-4 text-[0.84rem] font-semibold text-[#1d1d1f]"
                  />
                </div>
              </div>

              <div className="overflow-hidden bg-[#f5f5f7] p-4 md:p-7">
                {product.imagen_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imagen_url}
                    alt={product.nombre || 'Producto'}
                    className="store-image aspect-[1.15/1] h-full w-full rounded-[28px] object-contain object-center bg-white p-4 md:p-8"
                  />
                ) : (
                  <div className="flex aspect-[1.15/1] items-center justify-center rounded-[28px] bg-white px-6 text-center text-[0.92rem] text-[#6e6e73]">
                    Imagen pendiente
                  </div>
                )}
              </div>
            </article>

            <article className="store-surface overflow-hidden rounded-[34px] border border-[#0071e3]/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <div className="border-b border-[#0071e3]/10 px-6 py-5 md:px-8">
                <p className="text-[0.84rem] font-semibold uppercase tracking-[0.18em] text-[#86868b]">
                  Características
                </p>

              </div>

              <div className="store-scroll-subtle h-[26rem] overflow-y-auto bg-[#fbfbfd]">
                {productFeatures.length > 0 ? (
                  <div className="px-6 py-5 md:px-8">
                    <div className="space-y-3">
                      {productFeatures.map((feature, index) => (
                        <p
                          key={`${product.id}-feature-${index}`}
                          className="text-[0.98rem] leading-7 text-[#1d1d1f] md:text-[1rem]"
                        >
                          {feature}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="px-6 py-6 md:px-8">
                    <p className="text-[0.96rem] leading-7 text-[#6e6e73]">
                      Este producto aún no tiene características cargadas.
                    </p>
                  </div>
                )}
              </div>
            </article>
          </div>

          <article className="store-surface rounded-[34px] border border-[#0071e3]/10 bg-[#0071e3] px-6 py-7 text-white shadow-[0_16px_40px_rgba(0,113,227,0.18)] md:px-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="blue">{product.categoria || 'General'}</Badge>
              <Badge tone="blue">{product.sku || 'Sin SKU'}</Badge>
            </div>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[2.25rem] font-semibold tracking-[-0.04em] text-white md:text-[3rem]">
                  {money.format(Number(product.precio_venta || 0))}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
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
                  className="inline-flex min-h-[3rem] items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0071e3] transition hover:bg-[#f5f5f7]"
                >
                  Comprar ahora
                </AddToCartButton>
                <Link
                  href="/carrito"
                  className="inline-flex min-h-[3rem] items-center justify-center rounded-full border border-white/45 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
                >
                  Ver carrito
                </Link>
              </div>
            </div>
          </article>

        </div>
      </section>

      <section className="store-section store-delay-1 store-shell pb-12">
        <article className="rounded-[34px] border border-[#0071e3]/10 bg-white px-6 py-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.84rem] font-semibold uppercase tracking-[0.22em] text-[#86868b]">
                Opiniones
              </p>
              <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[#1d1d1f] md:text-[3rem]">
                Reseñas
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-3">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-[22px] border border-[#0071e3]/10 bg-[#fbfcff] px-5 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[1rem] font-semibold text-[#1d1d1f]">{review.nombre_mostrado}</p>
                      <p className="text-[0.9rem] font-semibold text-[#0071e3]">
                        {review.rating}/5
                      </p>
                    </div>
                    <p className="mt-3 text-[0.96rem] leading-7 text-[#424245]">{review.comentario}</p>
                  </article>
                ))
              ) : (
                <article className="rounded-[22px] border border-[#0071e3]/10 bg-[#fbfcff] px-5 py-4">
                  <p className="text-[0.96rem] font-semibold text-[#1d1d1f]">Todavía no hay reseñas.</p>
                </article>
              )}
            </div>

            <div>
              {user ? (
                <StoreReviewForm productId={product.id} />
              ) : (
                <article className="rounded-[24px] border border-[#0071e3]/10 bg-[#fbfcff] px-5 py-5">
                  <p className="text-[0.96rem] font-semibold text-[#1d1d1f]">
                    Inicia sesión para dejar tu reseña.
                  </p>
                </article>
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="store-section store-delay-1 store-shell pb-12">
        <article className="rounded-[34px] border border-[#0071e3]/10 bg-white px-6 py-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] md:px-8">
          <div className="text-center">
            <p className="text-[0.84rem] font-semibold uppercase tracking-[0.22em] text-[#86868b]">
              También te puede interesar
            </p>
            <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[#1d1d1f] md:text-[3.2rem]">
              Sigue explorando
            </h2>
          </div>

          <div className="mt-4 flex justify-center">
            <Link
              href="/"
              className="inline-flex min-h-[2.9rem] items-center justify-center rounded-full px-4 text-sm font-semibold text-[#0071e3] transition hover:bg-[#0071e3]/8"
            >
              Volver al catálogo
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.map((item) => (
              <Link
                key={item.id}
                href={`/producto/${item.id}`}
                className="group store-surface overflow-hidden rounded-[28px] border border-[#0071e3]/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
              >
                <div className="overflow-hidden bg-[#f5f5f7]">
                  {item.imagen_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imagen_url}
                      alt={item.nombre || 'Producto'}
                      className="store-image aspect-[1/1] h-full w-full object-contain object-center p-4"
                    />
                  ) : (
                    <div className="flex aspect-[1/1] items-center justify-center px-6 text-center text-[0.86rem] text-[#6e6e73]">
                      Imagen pendiente
                    </div>
                  )}
                </div>

                <div className="px-5 py-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
                      {item.categoria || 'General'}
                    </span>
                    <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
                      {item.sku || 'Sin SKU'}
                    </span>
                  </div>
                  <h3 className="mt-3 text-[1.08rem] font-semibold leading-6 text-[#1d1d1f]">
                    {item.nombre || 'Producto'}
                  </h3>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <p className="text-[1.22rem] font-semibold text-[#1d1d1f]">
                      {money.format(Number(item.precio_venta || 0))}
                    </p>
                    <span className="text-[0.82rem] font-semibold text-[#0071e3]">
                      Ver detalle
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <StoreFooter />
    </main>
  )
}

function Badge({
  children,
  tone = 'default',
}: {
  children: React.ReactNode
  tone?: 'default' | 'blue'
}) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.16em] ${
        tone === 'blue'
          ? 'bg-white/12 text-white ring-1 ring-white/18'
          : 'bg-[#f5f5f7] text-[#6e6e73]'
      }`}
    >
      {children}
    </span>
  )
}
