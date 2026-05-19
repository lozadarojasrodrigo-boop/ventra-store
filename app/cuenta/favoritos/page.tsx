import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AddToCartButton } from '@/app/components/AddToCartButton'
import { FavoriteToggleButton } from '@/app/components/FavoriteToggleButton'
import { StoreFooter } from '@/app/components/StoreFooter'
import { StoreHeader } from '@/app/components/StoreHeader'
import { getFavoriteProductsForUser } from '@/lib/store/customer'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const money = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export default async function AccountFavoritesPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/ingresar')
  }

  const favorites = await getFavoriteProductsForUser(user.id)

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <StoreHeader
        utilitySlot={
          <Link
            href="/cuenta"
            className="inline-flex min-h-[2.7rem] items-center justify-center rounded-full px-4 text-[0.92rem] font-medium text-[#1d1d1f] transition hover:bg-black/4"
          >
            Volver a mi cuenta
          </Link>
        }
      />

      <section className="store-shell py-6">
        <article className="store-panel rounded-[30px] p-7">
          <p className="text-[0.82rem] font-semibold uppercase tracking-[0.2em] text-[#86868b]">
            Favoritos
          </p>
          <h1 className="mt-2 text-[2.2rem] font-semibold tracking-[-0.05em] text-[#1d1d1f] md:text-[3.6rem]">
            Guardados
          </h1>

          {favorites.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-[#0071e3]/10 bg-[#fbfcff] px-5 py-5">
              <p className="text-[0.96rem] font-semibold text-[#1d1d1f]">Aún no guardaste productos.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {favorites.map((product) => (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-[24px] border border-[#0071e3]/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
                >
                  <div className="relative overflow-hidden bg-[#f5f5f7]">
                    <div className="absolute right-3 top-3 z-10">
                      <FavoriteToggleButton productId={product.id} initialActive iconOnly className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#0071e3]/10 bg-white text-[#0071e3]" />
                    </div>
                    {product.imagen_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imagen_url}
                        alt={product.nombre || 'Producto'}
                        className="h-full w-full object-contain object-center p-5"
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
                    <h2 className="mt-3 text-[1.12rem] font-semibold tracking-[-0.02em] text-[#1d1d1f]">
                      {product.nombre || 'Producto'}
                    </h2>
                    <p className="mt-4 text-[1.22rem] font-semibold text-[#1d1d1f]">
                      {money.format(Number(product.precio_venta || 0))}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link
                        href={`/producto/${product.id}`}
                        className="inline-flex min-h-[2.8rem] items-center justify-center rounded-full bg-[#0071e3] px-4 py-2 text-[0.82rem] font-semibold text-white transition hover:bg-[#0077ed]"
                      >
                        Ver producto
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
                        disabled={product.estado_publicacion !== 'disponible'}
                        className="inline-flex min-h-[2.8rem] items-center justify-center rounded-full border border-[#0071e3] px-4 py-2 text-[0.82rem] font-semibold text-[#0071e3] transition hover:border-[#0071e3] hover:bg-[#0071e3] hover:text-white"
                      >
                        {product.estado_publicacion === 'disponible' ? 'Comprar' : 'No disponible'}
                      </AddToCartButton>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>

      <StoreFooter />
    </main>
  )
}
