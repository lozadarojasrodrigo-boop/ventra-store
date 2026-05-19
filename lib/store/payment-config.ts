import type { StorePaymentMethod } from '@/lib/store/web-orders'

export const storePaymentConfig = {
  whatsappNumber: '59171166435',
  transfer: {
    bankName: 'Banco por configurar',
    accountHolder: 'Titular por configurar',
    accountNumber: 'Cuenta por configurar',
  },
} as const

export function formatPaymentMethodLabel(method: StorePaymentMethod) {
  if (method === 'qr') return 'QR'
  if (method === 'transferencia') return 'Transferencia'
  return 'Efectivo'
}

const money = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function buildStoreWhatsAppHref({
  paymentMethod,
  total,
  customerName,
  orderCode,
  city,
  address,
  items,
}: {
  paymentMethod: StorePaymentMethod
  total: number
  customerName: string
  orderCode: string
  city: string
  address: string
  items: Array<{ nombre: string; quantity: number }>
}) {
  const phone = storePaymentConfig.whatsappNumber
  const introName = customerName.trim() || 'cliente'
  const itemsBlock = items.map((item) => `- ${item.nombre} x${item.quantity}`).join('\n')

  const lines =
    paymentMethod === 'qr'
      ? [
          `Hola, soy ${introName}.`,
          `Acabo de realizar mi pedido ${orderCode} en VENTRA Store.`,
          '',
          'Detalle del pedido:',
          itemsBlock,
          '',
          `Metodo: ${formatPaymentMethodLabel(paymentMethod)}`,
          `Monto: ${money.format(total)}`,
          `Ciudad: ${city}`,
          `Entrega: ${address}`,
          '',
          'Solicito el QR para realizar el pago y coordinar mi envio a domicilio.',
        ]
      : paymentMethod === 'transferencia'
        ? [
            `Hola, soy ${introName}.`,
            `Acabo de realizar mi pedido ${orderCode} en VENTRA Store.`,
            '',
            'Detalle del pedido:',
            itemsBlock,
            '',
            `Metodo: ${formatPaymentMethodLabel(paymentMethod)}`,
            `Monto: ${money.format(total)}`,
            `Ciudad: ${city}`,
            `Entrega: ${address}`,
            '',
            'Solicito los datos de la cuenta bancaria para pagar por transferencia y coordinar mi envio a domicilio.',
          ]
        : [
            `Hola, soy ${introName}.`,
            `Acabo de realizar mi pedido ${orderCode} en VENTRA Store.`,
            '',
            'Detalle del pedido:',
            itemsBlock,
            '',
            `Metodo: ${formatPaymentMethodLabel(paymentMethod)}`,
            `Monto: ${money.format(total)}`,
            `Ciudad: ${city}`,
            `Entrega: ${address}`,
            '',
            'Quiero coordinar mi envio a domicilio y pagar en efectivo.',
          ]

  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`
}
