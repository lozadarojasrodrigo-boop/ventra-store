import Link from 'next/link'

import { AddToCartButton } from '@/app/components/AddToCartButton'
import { FavoriteToggleButton } from '@/app/components/FavoriteToggleButton'
import { StoreFooter } from '@/app/components/StoreFooter'
import { StoreHeader } from '@/app/components/StoreHeader'
import { StoreSearchBox } from '@/app/components/StoreSearchBox'
import { getStoreProducts } from '@/lib/store/products'
import { searchStoreProducts } from '@/lib/store/search'

const money = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = '' } = await searchParams
  const products = await getStoreProducts()
  const query = q.trim()
  const results = query ? searchStoreProducts(products, query) : products.slice(0, 8)

  const recommendations = products
    .filter((product) => !results.some((result) => result.id === product.id))
    .slice(0, 4)

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <StoreHeader
        searchSlot={<StoreSearchBox products={products} initialQuery={q} />}
        utilitySlot={
          <Link
            href="/"
            className="inline-flex min-h-[2.7rem] items-center justify-center rounded-full px-4 text-[0.9rem] font-medium text-[#1d1d1f] transition hover:bg-black/4"
          >
            Inicio
          </Link>
        }
      />

      <section className="store-shell py-6">
        <div className="text-center">
          <p className="text-[0.84rem] font-semibold uppercase tracking-[0.22em] text-[#86868b]">
            Búsqueda
          </p>
          <h1 className="mt-3 text-[2.3rem] font-semibold tracking-[-0.05em] text-[#1d1d1f] md:text-[4rem]">
            {q.trim() ? `Resultados para "${q.trim()}"` : 'Explora productos'}
          </h1>
        </div>

        {results.length === 0 ? (
          <div className="mt-8 rounded-[28px] border border-[#0071e3]/10 bg-white px-8 py-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <p className="text-[1.05rem] font-semibold text-[#1d1d1f]">No encontramos coincidencias.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {results.map((product) => {
              const statusMeta = getStoreStatusMeta(product.estado_publicacion)

              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-[24px] border border-[#0071e3]/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
                >
                  <div className="relative overflow-hidden bg-[#f5f5f7]">
                    <div className="absolute right-3 top-3 z-10">
                      <FavoriteToggleButton
                        productId={product.id}
                        iconOnly
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#0071e3]/10 bg-white text-[#1d1d1f]"
                      />
                    </div>
                    {product.imagen_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imagen_url}
                        alt={product.nombre || 'Producto'}
                        className="h-full w-full object-contain object-center p-4"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center px-6 text-center text-[0.9rem] text-[#6e6e73]">
                        Imagen pendiente
                      </div>
                    )}
                  </div>
                  <div className="px-5 py-5">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
                      {product.categoria || 'General'}
                    </p>
                    <h2 className="mt-3 text-[1.18rem] font-semibold tracking-[-0.02em] text-[#1d1d1f]">
                      {product.nombre || 'Producto'}
                    </h2>
                    <p className="mt-2 text-[0.92rem] text-[#424245]">{statusMeta.label}</p>
                    <p className="mt-4 text-[1.26rem] font-semibold text-[#1d1d1f]">
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
            })}
          </div>
        )}

        <section className="mt-12">
          <div className="text-center">
            <p className="text-[0.84rem] font-semibold uppercase tracking-[0.22em] text-[#86868b]">
              Recomendaciones
            </p>
            <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[#1d1d1f] md:text-[3rem]">
              También te puede interesar
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {recommendations.map((product) => (
              <Link
                key={product.id}
                href={`/producto/${product.id}`}
                className="overflow-hidden rounded-[24px] border border-[#0071e3]/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition hover:-translate-y-1"
              >
                <div className="overflow-hidden bg-[#f5f5f7]">
                  {product.imagen_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imagen_url}
                      alt={product.nombre || 'Producto'}
                      className="h-full w-full object-contain object-center p-4"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center px-6 text-center text-[0.9rem] text-[#6e6e73]">
                      Imagen pendiente
                    </div>
                  )}
                </div>
                <div className="px-5 py-5">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
                    {product.categoria || 'General'}
                  </p>
                  <h3 className="mt-3 text-[1.12rem] font-semibold tracking-[-0.02em] text-[#1d1d1f]">
                    {product.nombre || 'Producto'}
                  </h3>
                  <p className="mt-4 text-[1.22rem] font-semibold text-[#1d1d1f]">
                    {money.format(Number(product.precio_venta || 0))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </section>

      <StoreFooter />
    </main>
  )
}

function getStoreStatusMeta(status: 'disponible' | 'agotado' | 'proximamente' | null) {
  switch (status) {
    case 'agotado':
      return { label: 'Agotado', canBuy: false }
    case 'proximamente':
      return { label: 'Próximamente', canBuy: false }
    default:
      return { label: 'Disponible', canBuy: true }
  }
}
