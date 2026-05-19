import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { StoreFooter } from '@/app/components/StoreFooter'
import { ReorderButton } from '@/app/components/ReorderButton'
import { StoreHeader } from '@/app/components/StoreHeader'
import { StoreOrderProofUpload } from '@/app/components/StoreOrderProofUpload'
import { StoreSignOutButton } from '@/app/components/StoreSignOutButton'
import {
  formatWebOrderStatus,
  getWebOrderTimeline,
  orderStatusClassName,
} from '@/lib/store/order-status'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const money = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

type OrderDetail = {
  id: number
  codigo: string | null
  estado: string | null
  estado_pago: string | null
  metodo_pago: string | null
  total: number | null
  subtotal: number | null
  created_at: string | null
  cliente_nombre: string | null
  cliente_telefono: string | null
  cliente_correo: string | null
  cliente_ciudad: string | null
  cliente_direccion: string | null
  payment_proof_path: string | null
  payment_proof_uploaded_at: string | null
  pedido_web_items:
    | {
        id: number
        producto_id: number | null
        producto_nombre: string | null
        producto_sku: string | null
        cantidad: number | null
        precio_unitario: number | null
        subtotal: number | null
      }[]
    | null
}

async function getOrderForUser(userId: string, code: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('pedidos_web')
    .select(
      'id,codigo,estado,estado_pago,metodo_pago,total,subtotal,created_at,cliente_nombre,cliente_telefono,cliente_correo,cliente_ciudad,cliente_direccion,payment_proof_path,payment_proof_uploaded_at,pedido_web_items(id,producto_id,producto_nombre,producto_sku,cantidad,precio_unitario,subtotal)'
    )
    .eq('auth_user_id', userId)
    .eq('codigo', code)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data || null) as OrderDetail | null
}

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/ingresar')
  }

  const { code } = await params
  const order = await getOrderForUser(user.id, code)

  if (!order) {
    notFound()
  }

  const timeline = getWebOrderTimeline(order.estado || 'pendiente')
  const proofUrl = order.payment_proof_path
    ? getSupabaseAdmin().storage.from('web-order-proofs').getPublicUrl(order.payment_proof_path).data.publicUrl
    : null
  const reorderItems = (order.pedido_web_items || []).map((item) => ({
    id: Number(item.producto_id || item.id),
    nombre: item.producto_nombre || 'Producto',
    precio_venta: Number(item.precio_unitario || 0),
    imagen_url: null,
    sku: item.producto_sku || null,
    categoria: null,
    stock_actual: Math.max(Number(item.cantidad || 1), 1),
    quantity: Math.max(Number(item.cantidad || 1), 1),
  }))

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <StoreHeader utilitySlot={<StoreSignOutButton />} />

      <section className="store-shell py-6">
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="store-panel rounded-[30px] p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[0.86rem] font-semibold uppercase tracking-[0.22em] text-[#86868b]">
                  Detalle del pedido
                </p>
                <h1 className="mt-3 text-[2.25rem] font-semibold tracking-[-0.05em] text-[#1d1d1f] md:text-[3.6rem]">
                  {order.codigo || `Pedido #${order.id}`}
                </h1>
              </div>
              <span
                className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.12em] ${orderStatusClassName(order.estado || 'pendiente')}`}
              >
                {formatWebOrderStatus(order.estado || 'pendiente')}
              </span>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <InfoTile label="Pago" value={order.estado_pago || '-'} />
              <InfoTile label="Método" value={order.metodo_pago || '-'} />
              <InfoTile
                label="Fecha"
                value={order.created_at ? new Date(order.created_at).toLocaleDateString('es-ES') : '-'}
              />
              <InfoTile label="Total" value={money.format(Number(order.total || 0))} />
              <InfoTile label="Cliente" value={order.cliente_nombre || '-'} />
              <InfoTile label="Celular" value={order.cliente_telefono || '-'} />
              <InfoTile label="Correo" value={order.cliente_correo || '-'} />
              <InfoTile label="Ciudad" value={order.cliente_ciudad || '-'} />
            </div>

            <div className="mt-6 rounded-[24px] border border-[#0071e3]/10 bg-[#fbfcff] px-5 py-5">
              <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
                Dirección
              </p>
              <p className="mt-2 text-[0.98rem] leading-7 text-[#1d1d1f]">
                {order.cliente_direccion || '-'}
              </p>
            </div>

            <div className="mt-6">
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/cuenta"
                  className="inline-flex min-h-[2.9rem] items-center justify-center rounded-full border border-[#0071e3]/10 bg-white px-4 text-[0.92rem] font-medium text-[#1d1d1f] transition hover:bg-[#f8fbff]"
                >
                  Volver a mis pedidos
                </Link>
                <ReorderButton
                  items={reorderItems}
                  className="inline-flex min-h-[2.9rem] items-center justify-center rounded-full bg-[#0071e3] px-4 text-[0.92rem] font-semibold text-white transition hover:bg-[#0077ed]"
                />
              </div>
            </div>
          </article>

          <section className="space-y-6">
            <StoreOrderProofUpload
              code={order.codigo || String(order.id)}
              proofUrl={proofUrl}
              paymentMethod={order.metodo_pago}
            />
            <article className="store-panel rounded-[30px] p-7">
              <p className="text-[0.86rem] font-semibold uppercase tracking-[0.22em] text-[#86868b]">
                Timeline
              </p>
              <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[#1d1d1f]">
                Estado del pedido
              </h2>

              <div className="mt-6 space-y-4">
                {timeline.map((step, index) => (
                  <div key={step.key} className="flex gap-4">
                    <div className="flex w-8 flex-col items-center">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-[0.78rem] font-semibold ${
                          step.state === 'done'
                            ? 'border-[#0071e3] bg-[#0071e3] text-white'
                            : step.state === 'current'
                              ? 'border-[#0071e3] bg-white text-[#0071e3]'
                              : 'border-[#d7deea] bg-white text-[#9aa3af]'
                        }`}
                      >
                        {index + 1}
                      </span>
                      {index < timeline.length - 1 ? (
                        <span
                          className={`mt-2 h-full min-h-[2.4rem] w-px ${
                            step.state === 'done' ? 'bg-[#0071e3]/35' : 'bg-[#d7deea]'
                          }`}
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 rounded-[22px] border border-[#0071e3]/10 bg-[#fbfcff] px-5 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[1rem] font-semibold text-[#1d1d1f]">{step.title}</p>
                        <span
                          className={`text-[0.78rem] font-semibold uppercase tracking-[0.14em] ${
                            step.state === 'done'
                              ? 'text-[#0071e3]'
                              : step.state === 'current'
                                ? 'text-[#1d1d1f]'
                                : 'text-[#9aa3af]'
                          }`}
                        >
                          {step.state === 'done'
                            ? 'Completo'
                            : step.state === 'current'
                              ? 'Actual'
                              : 'Siguiente'}
                        </span>
                      </div>
                      <p className="mt-2 text-[0.94rem] leading-7 text-[#424245]">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="store-panel rounded-[30px] p-7">
              <p className="text-[0.86rem] font-semibold uppercase tracking-[0.22em] text-[#86868b]">
                Productos
              </p>
              <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[#1d1d1f]">
                Resumen de compra
              </h2>

              <div className="mt-6 space-y-3">
                {(order.pedido_web_items || []).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[22px] border border-[#0071e3]/10 bg-[#fbfcff] px-5 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[1rem] font-semibold text-[#1d1d1f]">
                          {item.producto_nombre || 'Producto'}
                        </p>
                        <p className="mt-1 text-[0.88rem] text-[#6e6e73]">
                          {item.producto_sku || 'Sin SKU'} · {Number(item.cantidad || 0)} unidad(es)
                        </p>
                        <p className="mt-1 text-[0.88rem] text-[#6e6e73]">
                          {money.format(Number(item.precio_unitario || 0))} por unidad
                        </p>
                      </div>
                      <p className="text-[1rem] font-semibold text-[#1d1d1f]">
                        {money.format(Number(item.subtotal || 0))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 rounded-[24px] bg-[#0071e3] px-5 py-5 text-white">
                <p className="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-white/85">
                  Total final
                </p>
                <p className="text-[1.65rem] font-semibold tracking-[-0.03em]">
                  {money.format(Number(order.total || 0))}
                </p>
              </div>
            </article>
          </section>
        </div>
      </section>

      <StoreFooter />
    </main>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[#0071e3]/10 bg-[#fbfcff] px-4 py-4">
      <p className="text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-[#86868b]">
        {label}
      </p>
      <p className="mt-2 text-[0.96rem] font-semibold text-[#1d1d1f]">{value}</p>
    </div>
  )
}
