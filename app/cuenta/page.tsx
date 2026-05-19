import Link from 'next/link'
import { redirect } from 'next/navigation'

import { StoreFooter } from '@/app/components/StoreFooter'
import { StoreHeader } from '@/app/components/StoreHeader'
import { StoreSignOutButton } from '@/app/components/StoreSignOutButton'
import { buildPersonalRecommendations, getAddressesForUser, getFavoriteProductsForUser } from '@/lib/store/customer'
import { formatWebOrderStatus, orderStatusClassName } from '@/lib/store/order-status'
import { getStoreProducts } from '@/lib/store/products'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const money = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

type AccountOrder = {
  id: number
  codigo: string | null
  estado: string | null
  estado_pago: string | null
  metodo_pago: string | null
  total: number | null
  created_at: string | null
  cliente_ciudad: string | null
  cliente_direccion: string | null
  pedido_web_items:
    | {
        id: number
        producto_nombre: string | null
        cantidad: number | null
        subtotal: number | null
  }[]
    | null
}

type CustomerProfile = {
  nombre: string | null
  apellido: string | null
  celular: string | null
  ciudad: string | null
  correo: string | null
}

type AccountView = 'todos' | 'activos' | 'historial'

async function getOrdersForUser(userId: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('pedidos_web')
    .select(
      'id,codigo,estado,estado_pago,metodo_pago,total,created_at,cliente_ciudad,cliente_direccion,pedido_web_items(id,producto_nombre,cantidad,subtotal)'
    )
    .eq('auth_user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as AccountOrder[]
}

async function getProfileForUser(userId: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('store_customer_profiles')
    .select('nombre,apellido,celular,ciudad,correo')
    .eq('auth_user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data || null) as CustomerProfile | null
}

function isActiveOrder(status: string | null) {
  return (
    status === 'pendiente' ||
    status === 'pago_en_revision' ||
    status === 'procesando' ||
    status === 'confirmado' ||
    status === 'preparando' ||
    status === 'enviado'
  )
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>
}) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/ingresar')
  }

  const orders = await getOrdersForUser(user.id)
  const profile = await getProfileForUser(user.id)
  const favoriteProducts = await getFavoriteProductsForUser(user.id)
  const addresses = await getAddressesForUser(user.id)
  const recommendations = buildPersonalRecommendations(await getStoreProducts(), favoriteProducts)
  const params = (await searchParams) || {}
  const requestedView = params.view
  const currentView: AccountView =
    requestedView === 'activos' || requestedView === 'historial' ? requestedView : 'todos'
  const activeOrders = orders.filter((order) => isActiveOrder(order.estado))
  const historyOrders = orders.filter((order) => !isActiveOrder(order.estado))
  const visibleOrders =
    currentView === 'activos' ? activeOrders : currentView === 'historial' ? historyOrders : orders
  const firstName = (profile?.nombre || '').trim()
  const lastName = (profile?.apellido || '').trim()
  const fullName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user.email || 'Cliente')
  const phone = (profile?.celular || '').trim() || '-'
  const city = (profile?.ciudad || '').trim() || '-'
  const profileEmail = (profile?.correo || '').trim() || user.email || '-'

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <StoreHeader utilitySlot={<StoreSignOutButton />} />

      <section className="store-shell py-6">
        <article className="store-panel rounded-[30px] p-7">
          <p className="text-[0.86rem] font-semibold uppercase tracking-[0.22em] text-[#86868b]">
            Mi cuenta
          </p>
          <h1 className="mt-3 text-[2.4rem] font-semibold tracking-[-0.05em] text-[#1d1d1f] md:text-[4rem]">
            {fullName}
          </h1>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <SummaryTile label="Pedidos" value={String(orders.length)} />
            <SummaryTile label="Favoritos" value={String(favoriteProducts.length)} />
            <SummaryTile
              label="Ultimo estado"
              value={orders[0]?.estado ? formatWebOrderStatus(orders[0].estado) : 'Sin pedidos'}
            />
            <SummaryTile label="Direcciones" value={String(addresses.length)} />
            <SummaryTile label="Celular" value={phone} />
            <SummaryTile label="Ciudad" value={city} />
          </div>
        </article>

        <section className="store-panel mt-6 rounded-[30px] p-7">
          <div className="grid gap-4 md:grid-cols-3">
            <QuickLink href="/cuenta/perfil" title="Perfil" value={profileEmail} />
            <QuickLink href="/cuenta/direcciones" title="Direcciones" value={`${addresses.length} guardadas`} />
            <QuickLink href="/cuenta/favoritos" title="Favoritos" value={`${favoriteProducts.length} productos`} />
          </div>
        </section>

        <section className="store-panel mt-6 rounded-[30px] p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-[#86868b]">
                Mis pedidos
              </p>
              <h2 className="mt-2 text-[1.95rem] font-semibold tracking-[-0.04em] text-[#1d1d1f]">
                Seguimiento web
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/cuenta/perfil"
                className="inline-flex min-h-[2.9rem] items-center justify-center rounded-full border border-[#0071e3]/10 bg-white px-4 text-[0.92rem] font-medium text-[#1d1d1f] transition hover:bg-[#f8fbff]"
              >
                Editar perfil
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-[2.9rem] items-center justify-center rounded-full border border-[#0071e3]/10 bg-white px-4 text-[0.92rem] font-medium text-[#1d1d1f] transition hover:bg-[#f8fbff]"
              >
                Seguir comprando
              </Link>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <FilterLink href="/cuenta" active={currentView === 'todos'}>
              Todos ({orders.length})
            </FilterLink>
            <FilterLink href="/cuenta?view=activos" active={currentView === 'activos'}>
              Activos ({activeOrders.length})
            </FilterLink>
            <FilterLink href="/cuenta?view=historial" active={currentView === 'historial'}>
              Historial ({historyOrders.length})
            </FilterLink>
          </div>

          {visibleOrders.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-[#0071e3]/10 bg-[#fbfcff] px-5 py-5">
              <p className="text-[1rem] font-semibold text-[#1d1d1f]">Aún no tienes pedidos en esta vista.</p>
              <p className="mt-2 text-[0.94rem] leading-7 text-[#424245]">
                Cuando hagas tu próxima compra mientras estás autenticado, aquí verás el estado completo del pedido.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {visibleOrders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-[24px] border border-[#0071e3]/10 bg-[#fbfcff] px-5 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[1.15rem] font-semibold text-[#1d1d1f]">
                        {order.codigo || `Pedido #${order.id}`}
                      </h3>
                      <p className="mt-1 text-[0.88rem] text-[#6e6e73]">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('es-ES') : '-'}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.12em] ${orderStatusClassName(order.estado || 'pendiente')}`}
                    >
                      {formatWebOrderStatus(order.estado || 'pendiente')}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <OrderMeta label="Pago" value={order.estado_pago || '-'} />
                    <OrderMeta label="Metodo" value={order.metodo_pago || '-'} />
                    <OrderMeta label="Ciudad" value={order.cliente_ciudad || '-'} />
                    <OrderMeta label="Direccion" value={order.cliente_direccion || '-'} />
                  </div>

                  <div className="mt-4 rounded-[20px] bg-white px-4 py-4">
                    {(order.pedido_web_items || []).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 border-b border-[#0071e3]/8 py-2 text-sm first:pt-0 last:border-b-0 last:pb-0"
                      >
                        <div>
                          <p className="font-semibold text-[#1d1d1f]">{item.producto_nombre || 'Producto'}</p>
                          <p className="text-[#6e6e73]">{Number(item.cantidad || 0)} unidad(es)</p>
                        </div>
                        <p className="font-semibold text-[#1d1d1f]">
                          {money.format(Number(item.subtotal || 0))}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-[0.84rem] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
                      Total
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="text-[1.15rem] font-semibold text-[#1d1d1f]">
                        {money.format(Number(order.total || 0))}
                      </p>
                      <Link
                        href={`/cuenta/pedidos/${encodeURIComponent(order.codigo || String(order.id))}`}
                        className="inline-flex min-h-[2.5rem] items-center justify-center rounded-full border border-[#0071e3]/10 bg-white px-3 text-[0.82rem] font-semibold text-[#1d1d1f] transition hover:bg-[#f8fbff]"
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {recommendations.length > 0 ? (
          <section className="store-panel mt-6 rounded-[30px] p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-[#86868b]">
                  Para ti
                </p>
                <h2 className="mt-2 text-[1.95rem] font-semibold tracking-[-0.04em] text-[#1d1d1f]">
                  Recomendaciones
                </h2>
              </div>
              <Link
                href="/cuenta/favoritos"
                className="inline-flex min-h-[2.7rem] items-center justify-center rounded-full border border-[#0071e3]/10 bg-white px-4 text-[0.88rem] font-medium text-[#1d1d1f]"
              >
                Ver favoritos
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {recommendations.map((product) => (
                <Link
                  key={product.id}
                  href={`/producto/${product.id}`}
                  className="rounded-[24px] border border-[#0071e3]/10 bg-[#fbfcff] px-5 py-5"
                >
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
                    {product.categoria || 'General'}
                  </p>
                  <h3 className="mt-3 text-[1.02rem] font-semibold text-[#1d1d1f]">
                    {product.nombre || 'Producto'}
                  </h3>
                  <p className="mt-4 text-[1.08rem] font-semibold text-[#1d1d1f]">
                    {money.format(Number(product.precio_venta || 0))}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </section>

      <StoreFooter />
    </main>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[#0071e3]/10 bg-[#fbfcff] px-4 py-4">
      <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
        {label}
      </p>
      <p className="mt-2 text-[1.02rem] font-semibold text-[#1d1d1f]">{value}</p>
    </div>
  )
}

function OrderMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[#0071e3]/10 bg-white px-4 py-3">
      <p className="text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
        {label}
      </p>
      <p className="mt-1 text-[0.92rem] font-semibold text-[#1d1d1f]">{value}</p>
    </div>
  )
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[2.7rem] items-center justify-center rounded-full px-4 text-[0.9rem] font-semibold transition ${
        active
          ? 'bg-[#0071e3] text-white'
          : 'border border-[#0071e3]/10 bg-white text-[#1d1d1f] hover:bg-[#f8fbff]'
      }`}
    >
      {children}
    </Link>
  )
}

function QuickLink({ href, title, value }: { href: string; title: string; value: string }) {
  return (
    <Link
      href={href}
      className="rounded-[22px] border border-[#0071e3]/10 bg-[#fbfcff] px-4 py-4 transition hover:border-[#0071e3]/20"
    >
      <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
        {title}
      </p>
      <p className="mt-2 text-[1rem] font-semibold text-[#1d1d1f]">{value}</p>
    </Link>
  )
}
