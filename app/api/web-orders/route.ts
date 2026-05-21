import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { enqueueStoreNotification } from '@/lib/store/notifications'
import { processStoreEmailQueueById } from '@/lib/store/email-queue'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type {
  CreateWebOrderPayload,
  CreateWebOrderResponse,
  StorePaymentMethod,
} from '@/lib/store/web-orders'

type ProductRow = {
  id: number
  nombre: string | null
  sku: string | null
  imagen_url: string | null
  precio_venta: number | null
  stock_actual: number | null
  activo: boolean | null
  estado_publicacion: 'disponible' | 'agotado' | 'proximamente' | null
}

const validPaymentMethods = new Set<StorePaymentMethod>([
  'qr',
  'transferencia',
  'efectivo',
])

function badRequest(error: string, status = 400) {
  return NextResponse.json<CreateWebOrderResponse>(
    {
      ok: false,
      error,
    },
    { status }
  )
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function buildOrderCode(orderId: number) {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `WEB${yy}${mm}${dd}${String(orderId).padStart(5, '0')}`
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin()
  const sessionClient = await getSupabaseServerClient()
  const {
    data: { user },
  } = await sessionClient.auth.getUser()

  let payload: CreateWebOrderPayload

  try {
    payload = (await request.json()) as CreateWebOrderPayload
  } catch {
    return badRequest('No se pudo leer el pedido.')
  }

  const paymentMethod = payload?.paymentMethod
  if (typeof paymentMethod !== 'string') {
    return badRequest('Metodo de pago invalido.')
  }
  if (!validPaymentMethods.has(paymentMethod)) {
    return badRequest('Metodo de pago invalido.')
  }

  const nombreCompleto = cleanText(payload?.customer?.nombreCompleto)
  const telefono = cleanText(payload?.customer?.telefono)
  const correo = cleanText(payload?.customer?.correo || payload?.accountEmail || user?.email)
  const ciudad = cleanText(payload?.customer?.ciudad)
  const direccion = cleanText(payload?.customer?.direccion)

  if (!nombreCompleto || !telefono || !ciudad || !direccion) {
    return badRequest('Completa nombre, telefono, ciudad y direccion de entrega.')
  }

  const rawItems = Array.isArray(payload?.items) ? payload.items : []
  const items = rawItems
    .map((item) => ({
      productId: Number(item?.productId),
      quantity: Number(item?.quantity),
    }))
    .filter(
      (item) =>
        Number.isInteger(item.productId) &&
        item.productId > 0 &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    )

  if (items.length === 0) {
    return badRequest('El carrito esta vacio.')
  }

  const productIds = Array.from(new Set(items.map((item) => item.productId)))

  const { data: productRows, error: productError } = await supabase
    .from('productos')
    .select('id,nombre,sku,imagen_url,precio_venta,stock_actual,activo,estado_publicacion')
    .in('id', productIds)
    .neq('activo', false)

  if (productError) {
    return badRequest('No se pudieron validar los productos.', 500)
  }

  const products = new Map<number, ProductRow>(
    ((productRows || []) as ProductRow[]).map((product) => [product.id, product])
  )

  let subtotal = 0

  const orderItems = items.map((item) => {
    const product = products.get(item.productId)
    if (!product) {
      return { error: 'Uno de los productos ya no esta disponible.' }
    }

    if (product.estado_publicacion === 'agotado' || product.estado_publicacion === 'proximamente') {
      return {
        error: `${product.nombre || 'Este producto'} no esta disponible para compra en este momento.`,
      }
    }

    const price = Number(product.precio_venta || 0)
    const stock = Number(product.stock_actual || 0)

    if (stock < item.quantity) {
      return {
        error: `Stock insuficiente para ${product.nombre || 'el producto seleccionado'}.`,
      }
    }

    const lineSubtotal = Number((price * item.quantity).toFixed(2))
    subtotal = Number((subtotal + lineSubtotal).toFixed(2))

    return {
      producto_id: product.id,
      producto_nombre: product.nombre || 'Producto',
      producto_sku: product.sku,
      producto_imagen_url: product.imagen_url,
      cantidad: item.quantity,
      precio_unitario: price,
      subtotal: lineSubtotal,
    }
  })

  const invalidItem = orderItems.find((item): item is { error: string } => 'error' in item)
  if (invalidItem) {
    return badRequest(invalidItem.error)
  }

  const normalizedOrderItems = orderItems.map((item) => ({
    producto_id: item.producto_id,
    producto_nombre: item.producto_nombre,
    producto_sku: item.producto_sku,
    cantidad: item.cantidad,
    precio_unitario: item.precio_unitario,
    subtotal: item.subtotal,
  }))

  const total = subtotal

  const { data: insertedOrder, error: orderError } = await supabase
    .from('pedidos_web')
    .insert({
      estado: 'pendiente',
      estado_pago: paymentMethod === 'efectivo' ? 'por_confirmar' : 'pendiente',
      metodo_pago: paymentMethod,
      auth_user_id: user?.id ?? null,
      cliente_nombre: nombreCompleto,
      cliente_telefono: telefono,
      cliente_correo: correo || '',
      cliente_ciudad: ciudad,
      cliente_direccion: direccion,
      subtotal,
      total,
      origen: 'ventra-store',
    })
    .select('id')
    .single()

  if (orderError || !insertedOrder) {
    return badRequest('No se pudo crear el pedido.', 500)
  }

  const orderId = Number(insertedOrder.id)
  const orderCode = buildOrderCode(orderId)

  const { error: itemInsertError } = await supabase.from('pedido_web_items').insert(
    normalizedOrderItems.map((item) => ({
      pedido_web_id: orderId,
      ...item,
    }))
  )

  if (itemInsertError) {
    await supabase.from('pedidos_web').delete().eq('id', orderId)
    return badRequest('No se pudieron guardar los items del pedido.', 500)
  }

  const { error: codeUpdateError } = await supabase
    .from('pedidos_web')
    .update({ codigo: orderCode })
    .eq('id', orderId)

  if (codeUpdateError) {
    return badRequest('El pedido se creo, pero no se pudo finalizar su codigo.', 500)
  }

  const { data: queueInsert, error: queueInsertError } = await supabase
    .from('store_email_notification_queue')
    .insert({
      auth_user_id: user?.id ?? null,
      pedido_web_id: orderId,
      recipient_email: correo,
      event_type: 'order_received',
      payload: {
        codigo: orderCode,
        metodo_pago: paymentMethod,
        total,
        cliente_nombre: nombreCompleto,
        ciudad,
        direccion,
        items: orderItems.map((item) => ({
          nombre: item.producto_nombre,
          cantidad: item.cantidad,
          subtotal: item.subtotal,
          imagen_url: item.producto_imagen_url,
        })),
      },
      status: 'pending',
    })
    .select('id')
    .single()

  if (!queueInsertError && queueInsert) {
    void processStoreEmailQueueById(queueInsert.id).catch(() => undefined)
  } else {
    await enqueueStoreNotification(supabase, {
      authUserId: user?.id ?? null,
      orderId,
      recipientEmail: correo,
      eventType: 'order_received',
      payload: {
        codigo: orderCode,
        metodo_pago: paymentMethod,
        total,
        cliente_nombre: nombreCompleto,
        ciudad,
        direccion,
        items: orderItems.map((item) => ({
          nombre: item.producto_nombre,
          cantidad: item.cantidad,
          subtotal: item.subtotal,
          imagen_url: item.producto_imagen_url,
        })),
      },
    })
  }

  return NextResponse.json<CreateWebOrderResponse>({
    ok: true,
    orderId,
    orderCode,
  })
}
