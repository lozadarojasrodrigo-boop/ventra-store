import Link from 'next/link'
import { notFound } from 'next/navigation'

import { StoreFooter } from '@/app/components/StoreFooter'
import { StoreHeader } from '@/app/components/StoreHeader'
import {
  buildStoreWhatsAppHref,
  formatPaymentMethodLabel,
  storePaymentConfig,
} from '@/lib/store/payment-config'
import { formatWebOrderStatus, orderStatusClassName } from '@/lib/store/order-status'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { StorePaymentMethod } from '@/lib/store/web-orders'

const money = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

type WebOrderPageProps = {
  params: Promise<{ code: string }>
}

type OrderRow = {
  codigo: string | null
  estado: string | null
  cliente_nombre: string | null
  cliente_telefono: string | null
  cliente_ciudad: string | null
  cliente_direccion: string | null
  metodo_pago: StorePaymentMethod | null
  total: number | null
  pedido_web_items:
    | {
        producto_nombre: string | null
        cantidad: number | null
        subtotal: number | null
      }[]
    | null
}

async function getOrderByCode(code: string) {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('pedidos_web')
    .select(
      'codigo,estado,cliente_nombre,cliente_telefono,cliente_ciudad,cliente_direccion,metodo_pago,total,pedido_web_items(producto_nombre,cantidad,subtotal)'
    )
    .eq('codigo', code)
    .single()

  if (error || !data) {
    return null
  }

  return data as OrderRow
}

export default async function WebOrderConfirmationPage({ params }: WebOrderPageProps) {
  const { code } = await params
  const order = await getOrderByCode(code)

  if (!order || !order.metodo_pago) {
    notFound()
  }

  const whatsappHref = buildStoreWhatsAppHref({
    paymentMethod: order.metodo_pago,
    total: Number(order.total || 0),
    customerName: order.cliente_nombre || 'cliente',
    orderCode: order.codigo || code,
  })

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <StoreHeader
        utilitySlot={
          <Link
            href="/"
            className="inline-flex min-h-[2.7rem] items-center justify-center rounded-full px-4 text-[0.92rem] font-medium text-[#1d1d1f] transition hover:bg-black/4"
          >
            Volver a la tienda
          </Link>
        }
      />

      <section className="store-section store-shell py-6">
        <div className="text-center">
          <p className="text-[0.86rem] font-semibold tracking-[0.22em] text-[#86868b] uppercase">
            Pedido recibido
          </p>
          <h1 className="mt-3 text-[2.5rem] font-semibold tracking-[-0.05em] text-[#1d1d1f] md:text-[4.7rem]">
            Ahora sigue el pago
          </h1>
          <p className="mx-auto mt-4 max-w-[42rem] text-[1rem] leading-8 text-[#424245]">
            Tu pedido ya fue registrado correctamente. Sigue estos pasos segun el metodo que elegiste y luego contactanos para validarlo.
          </p>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <aside className="store-surface rounded-[30px] bg-white p-7 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
            <p className="text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-[#86868b]">
              Resumen del pedido
            </p>
            <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[#1d1d1f]">
              {order.codigo}
            </h2>

            <div className="mt-5 space-y-3">
              <SummaryRow label="Estado" value={formatWebOrderStatus(order.estado || 'pendiente')} />
              <SummaryRow label="Cliente" value={order.cliente_nombre || '-'} />
              <SummaryRow label="Ciudad" value={order.cliente_ciudad || '-'} />
              <SummaryRow label="Direccion" value={order.cliente_direccion || '-'} />
              <SummaryRow
                label="Metodo"
                value={formatPaymentMethodLabel(order.metodo_pago)}
              />
              <SummaryRow label="Total" value={money.format(Number(order.total || 0))} />
            </div>

            <div className="mt-6 space-y-3">
              {(order.pedido_web_items || []).map((item, index) => (
                <div
                  key={`${item.producto_nombre || 'item'}-${index}`}
                  className="store-surface rounded-[22px] bg-[#f5f5f7] px-4 py-4"
                >
                  <p className="text-[0.98rem] font-semibold text-[#1d1d1f]">
                    {item.producto_nombre || 'Producto'}
                  </p>
                  <p className="mt-1 text-[0.84rem] text-[#424245]">
                    {Number(item.cantidad || 0)} unidad(es)
                  </p>
                  <p className="mt-2 text-[0.96rem] font-semibold text-[#1d1d1f]">
                    {money.format(Number(item.subtotal || 0))}
                  </p>
                </div>
              ))}
            </div>
          </aside>

          <section className="space-y-6">
            <article className="store-surface rounded-[30px] bg-white p-7 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-[#86868b]">
                Siguiente paso
              </p>
              <div className="mt-4">
                <span
                  className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.12em] ${orderStatusClassName(order.estado || 'pendiente')}`}
                >
                  {formatWebOrderStatus(order.estado || 'pendiente')}
                </span>
              </div>
              <h2 className="mt-3 text-[1.95rem] font-semibold tracking-[-0.04em] text-[#1d1d1f]">
                {order.metodo_pago === 'qr'
                  ? 'Paga por QR y envia tu comprobante'
                  : order.metodo_pago === 'transferencia'
                    ? 'Haz la transferencia y envia tu comprobante'
                    : 'Coordina entrega o retiro en efectivo'}
              </h2>

              {order.metodo_pago === 'qr' ? (
                <>
                  <p className="mt-4 text-[0.98rem] leading-8 text-[#424245]">
                    Usa tu app de QR habitual, ingresa el monto exacto y conserva tu comprobante para validarlo con nosotros.
                  </p>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <InfoTile label="Monto exacto" value={money.format(Number(order.total || 0))} />
                    <InfoTile
                      label="WhatsApp"
                      value={`+${storePaymentConfig.whatsappNumber}`}
                    />
                  </div>
                  <ol className="mt-5 space-y-2 text-[0.95rem] leading-7 text-[#424245]">
                    <li>1. Abre tu aplicacion de QR.</li>
                    <li>2. Ingresa manualmente el monto exacto.</li>
                    <li>3. Realiza el pago.</li>
                    <li>4. Envianos el comprobante por WhatsApp para confirmar el pedido.</li>
                  </ol>
                </>
              ) : order.metodo_pago === 'transferencia' ? (
                <>
                  <p className="mt-4 text-[0.98rem] leading-8 text-[#424245]">
                    Realiza la transferencia con estos datos y luego comparte tu comprobante para validar el pedido.
                  </p>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <InfoTile label="Banco" value={storePaymentConfig.transfer.bankName} />
                    <InfoTile
                      label="Titular"
                      value={storePaymentConfig.transfer.accountHolder}
                    />
                    <InfoTile
                      label="Cuenta"
                      value={storePaymentConfig.transfer.accountNumber}
                    />
                    <InfoTile label="Monto exacto" value={money.format(Number(order.total || 0))} />
                  </div>
                  <ol className="mt-5 space-y-2 text-[0.95rem] leading-7 text-[#424245]">
                    <li>1. Realiza la transferencia por el monto exacto.</li>
                    <li>2. Guarda tu comprobante.</li>
                    <li>3. Envianos el comprobante por WhatsApp para confirmar el pedido.</li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="mt-4 text-[0.98rem] leading-8 text-[#424245]">
                    El pedido ya fue recibido. Ahora necesitamos coordinar contigo si sera entrega o retiro y el momento del pago.
                  </p>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <InfoTile label="Monto a preparar" value={money.format(Number(order.total || 0))} />
                    <InfoTile
                      label="WhatsApp"
                      value={`+${storePaymentConfig.whatsappNumber}`}
                    />
                  </div>
                  <ol className="mt-5 space-y-2 text-[0.95rem] leading-7 text-[#424245]">
                    <li>1. Escríbenos para coordinar entrega o retiro.</li>
                    <li>2. Confirmaremos disponibilidad y horario.</li>
                    <li>3. El pago se realiza en efectivo al momento acordado.</li>
                  </ol>
                </>
              )}

              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex min-h-[3rem] items-center justify-center rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-[#083a1f] transition hover:brightness-95"
              >
                Continuar por WhatsApp
              </a>
            </article>
          </section>
        </div>
      </section>

      <StoreFooter />
    </main>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="store-surface flex items-center justify-between gap-3 rounded-[22px] bg-[#f5f5f7] px-4 py-3">
      <span className="text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-[#86868b]">
        {label}
      </span>
      <span className="text-[0.98rem] font-semibold text-[#1d1d1f]">{value}</span>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="store-surface rounded-[22px] bg-[#f5f5f7] px-4 py-4">
      <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
        {label}
      </p>
      <p className="mt-2 text-[0.96rem] font-semibold text-[#1d1d1f]">{value}</p>
    </div>
  )
}
