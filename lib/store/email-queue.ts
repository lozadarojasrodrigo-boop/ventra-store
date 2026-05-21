import { formatWebOrderStatus } from '@/lib/store/order-status'
import { buildStoreWhatsAppHref, formatPaymentMethodLabel } from '@/lib/store/payment-config'
import type { StorePaymentMethod } from '@/lib/store/web-orders'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const money = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

type QueueEventType =
  | 'welcome_account'
  | 'order_received'
  | 'payment_review'
  | 'payment_confirmed'
  | 'order_sent'
  | 'order_delivered'

type QueueRow = {
  id: number
  auth_user_id: string | null
  pedido_web_id: number | null
  event_type: QueueEventType
  recipient_email: string
  payload: Record<string, unknown> | null
  status: 'pending' | 'processed' | 'failed'
}

type QueueOrder = {
  id: number
  codigo: string | null
  estado: string | null
  cliente_nombre: string | null
  cliente_correo: string | null
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

type QueuePayloadItem = {
  nombre?: string
  cantidad?: number
  subtotal?: number
  imagen_url?: string | null
}

function getBaseUrl() {
  const direct =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL

  if (!direct) {
    return 'https://ventrabolivia.com'
  }

  return direct.startsWith('http') ? direct : `https://${direct}`
}

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL || 'VENTRA <ventas@ventrabolivia.com>'
}

function getReplyToAddress() {
  return process.env.RESEND_REPLY_TO_EMAIL || 'ventrabolivia@gmail.com'
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderItems(items: QueueOrder['pedido_web_items']) {
  return (items || [])
    .map((item) => {
      const name = escapeHtml(item.producto_nombre || 'Producto')
      const quantity = Math.max(Number(item.cantidad || 1), 1)
      const subtotal = money.format(Number(item.subtotal || 0))
      return `<tr><td style="padding:10px 0;border-bottom:1px solid #e8eef7;color:#1d1d1f;">${name}</td><td style="padding:10px 0;border-bottom:1px solid #e8eef7;color:#6e6e73;text-align:center;">${quantity}</td><td style="padding:10px 0;border-bottom:1px solid #e8eef7;color:#1d1d1f;text-align:right;">${subtotal}</td></tr>`
    })
    .join('')
}

function renderPayloadItems(items: QueuePayloadItem[] = []) {
  return items
    .map((item) => {
      const name = escapeHtml(item.nombre || 'Producto')
      const quantity = Math.max(Number(item.cantidad || 1), 1)
      const subtotal = money.format(Number(item.subtotal || 0))
      const imageUrl =
        typeof item.imagen_url === 'string' && item.imagen_url.trim() ? item.imagen_url.trim() : ''

      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e8eef7;">
            <div style="display:flex;align-items:center;gap:12px;">
              ${
                imageUrl
                  ? `<img src="${escapeHtml(imageUrl)}" alt="${name}" style="width:56px;height:56px;object-fit:contain;border-radius:14px;background:#f5f5f7;border:1px solid rgba(0,113,227,0.08);padding:6px;" />`
                  : ''
              }
              <div>
                <div style="color:#1d1d1f;font-weight:700;">${name}</div>
                <div style="color:#6e6e73;font-size:13px;">Cantidad: ${quantity}</div>
              </div>
            </div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e8eef7;color:#1d1d1f;text-align:right;font-weight:700;">${subtotal}</td>
        </tr>
      `
    })
    .join('')
}

function getOrderLinks(order: QueueOrder) {
  const baseUrl = getBaseUrl()
  const code = encodeURIComponent(order.codigo || String(order.id))
  return {
    publicOrderUrl: `${baseUrl}/pedido/${code}`,
    accountOrderUrl: `${baseUrl}/cuenta/pedidos/${code}`,
  }
}

function getStepsText(order: QueueOrder) {
  if (order.metodo_pago === 'qr') {
    return 'Abre tu pedido, completa el pago por QR y comparte tu comprobante para validarlo cuanto antes.'
  }
  if (order.metodo_pago === 'transferencia') {
    return 'Realiza la transferencia, guarda el comprobante y subelo desde tu cuenta para acelerar la validacion.'
  }
  return 'Responderemos por WhatsApp para coordinar entrega o retiro y completar el pago en efectivo.'
}

function buildWelcomeEmailContent(payload: Record<string, unknown> | null, recipientEmail: string) {
  const baseUrl = getBaseUrl()
  const logoUrl = `${baseUrl}/logoweb.png`
  const firstName =
    typeof payload?.first_name === 'string' && payload.first_name.trim()
      ? payload.first_name.trim()
      : ''
  const fullName =
    typeof payload?.full_name === 'string' && payload.full_name.trim()
      ? payload.full_name.trim()
      : ''
  const customerName = firstName || fullName || recipientEmail.split('@')[0] || 'Cliente'
  const accountUrl = `${baseUrl}/cuenta`
  const profileUrl = `${baseUrl}/cuenta/perfil`
  const favoritesUrl = `${baseUrl}/cuenta/favoritos`

  const html = `
    <div style="background:#f5f5f7;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#1d1d1f;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid rgba(0,113,227,0.12);border-radius:28px;overflow:hidden;">
        <div style="padding:34px 32px 28px;border-bottom:1px solid rgba(0,113,227,0.1);text-align:center;">
          <img src="${logoUrl}" alt="VENTRA" style="display:block;width:88px;height:auto;margin:0 auto 18px;" />
          <div style="font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#6e6e73;font-weight:700;">VENTRA BOLIVIA</div>
          <h1 style="margin:14px 0 0;font-size:34px;line-height:1.05;">Tu cuenta ya esta lista</h1>
          <p style="margin:16px auto 0;max-width:520px;font-size:16px;line-height:1.8;color:#424245;">Hola ${escapeHtml(customerName)}, te damos la bienvenida a una experiencia de compra mas clara, rapida y organizada dentro de VENTRA.</p>
        </div>
        <div style="padding:28px 32px;">
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">
            <div style="border:1px solid rgba(0,113,227,0.1);background:#fbfcff;border-radius:18px;padding:14px 16px;">
              <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#86868b;font-weight:700;">Cuenta</div>
              <div style="margin-top:8px;font-size:15px;font-weight:700;">Activa</div>
            </div>
            <div style="border:1px solid rgba(0,113,227,0.1);background:#fbfcff;border-radius:18px;padding:14px 16px;">
              <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#86868b;font-weight:700;">Correo</div>
              <div style="margin-top:8px;font-size:15px;font-weight:700;">${escapeHtml(recipientEmail)}</div>
            </div>
          </div>
          <div style="margin-top:24px;border:1px solid rgba(0,113,227,0.1);background:#fbfcff;border-radius:22px;padding:18px 20px;">
            <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#86868b;font-weight:700;">Que puedes hacer ahora</div>
            <ul style="margin:12px 0 0;padding-left:18px;color:#424245;line-height:1.9;">
              <li>Guardar direcciones para comprar mas rapido.</li>
              <li>Seguir tus pedidos desde Mi cuenta.</li>
              <li>Subir comprobantes cuando pagues por QR o transferencia.</li>
              <li>Marcar productos como favoritos.</li>
            </ul>
          </div>
          <div style="margin-top:24px;border:1px solid rgba(0,113,227,0.1);background:#ffffff;border-radius:22px;padding:18px 20px;">
            <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#86868b;font-weight:700;">Recomendacion</div>
            <p style="margin:12px 0 0;font-size:15px;line-height:1.8;color:#424245;">Anade tu ciudad y tus datos completos en el perfil para acelerar el checkout y recibir mejor seguimiento de tus pedidos.</p>
          </div>
          <div style="margin-top:28px;display:flex;flex-wrap:wrap;gap:12px;">
            <a href="${accountUrl}" style="display:inline-block;background:#0071e3;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;">Ir a mi cuenta</a>
            <a href="${profileUrl}" style="display:inline-block;background:#ffffff;color:#1d1d1f;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;border:1px solid rgba(0,113,227,0.1);">Completar perfil</a>
            <a href="${favoritesUrl}" style="display:inline-block;background:#ffffff;color:#1d1d1f;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;border:1px solid rgba(0,113,227,0.1);">Ver favoritos</a>
          </div>
          <p style="margin:22px 0 0;font-size:13px;line-height:1.8;color:#86868b;">Este correo fue enviado por VENTRA Bolivia a ${escapeHtml(recipientEmail)}.</p>
        </div>
      </div>
    </div>
  `

  const text = [
    'Bienvenido a VENTRA Bolivia',
    '',
    `Hola ${customerName}, tu cuenta ya esta lista.`,
    'Ahora puedes guardar direcciones, seguir tus pedidos, subir comprobantes y marcar favoritos.',
    '',
    `Mi cuenta: ${accountUrl}`,
    `Perfil: ${profileUrl}`,
    `Favoritos: ${favoritesUrl}`,
  ].join('\n')

  return {
    subject: 'Bienvenido a VENTRA Bolivia',
    html,
    text,
    from: getFromAddress(),
  }
}

function buildOrderEmailContent(
  eventType: Exclude<QueueEventType, 'welcome_account'>,
  order: QueueOrder,
  payloadItems: QueuePayloadItem[] = []
) {
  const baseUrl = getBaseUrl()
  const logoUrl = `${baseUrl}/logoweb.png`
  const methodLabel = order.metodo_pago ? formatPaymentMethodLabel(order.metodo_pago) : 'Pago'
  const statusLabel = formatWebOrderStatus(order.estado || 'pendiente')
  const totalLabel = money.format(Number(order.total || 0))
  const customerName = order.cliente_nombre || 'Cliente'
  const city = order.cliente_ciudad || '-'
  const address = order.cliente_direccion || '-'
  const { publicOrderUrl, accountOrderUrl } = getOrderLinks(order)
  const whatsappHref =
    order.metodo_pago && order.cliente_nombre
      ? buildStoreWhatsAppHref({
          paymentMethod: order.metodo_pago,
          total: Number(order.total || 0),
          customerName,
          orderCode: order.codigo || String(order.id),
          city,
          address,
          items: (order.pedido_web_items || []).map((item) => ({
            nombre: item.producto_nombre || 'Producto',
            quantity: Math.max(Number(item.cantidad || 1), 1),
          })),
        })
      : null
  let title = 'Actualizacion de tu pedido'
  let intro = `Tu pedido ${order.codigo || `#${order.id}`} sigue avanzando correctamente.`

  if (eventType === 'order_received') {
    title = 'Recibimos tu compra en VENTRA'
    intro = `Tu pedido ${order.codigo || `#${order.id}`} fue registrado con exito.`
  } else if (eventType === 'payment_review') {
    title = 'Estamos revisando tu comprobante'
    intro = `Tu comprobante del pedido ${order.codigo || `#${order.id}`} ya entro en revision.`
  } else if (eventType === 'payment_confirmed') {
    title = 'Pago confirmado'
    intro = `Tu pedido ${order.codigo || `#${order.id}`} ya quedo confirmado y paso a preparacion.`
  } else if (eventType === 'order_sent') {
    title = 'Tu pedido fue enviado'
    intro = `El pedido ${order.codigo || `#${order.id}`} ya fue despachado.`
  } else if (eventType === 'order_delivered') {
    title = 'Pedido entregado'
    intro = `El pedido ${order.codigo || `#${order.id}`} fue marcado como entregado.`
  }

  const html = `
    <div style="background:#f5f5f7;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#1d1d1f;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid rgba(0,113,227,0.12);border-radius:28px;overflow:hidden;">
        <div style="padding:34px 32px 28px;border-bottom:1px solid rgba(0,113,227,0.1);text-align:center;">
          <img src="${logoUrl}" alt="VENTRA" style="display:block;width:88px;height:auto;margin:0 auto 18px;" />
          <div style="font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#6e6e73;font-weight:700;">VENTRA BOLIVIA</div>
          <h1 style="margin:14px 0 0;font-size:34px;line-height:1.05;">${escapeHtml(title)}</h1>
          <p style="margin:16px auto 0;max-width:540px;font-size:16px;line-height:1.8;color:#424245;">Hola ${escapeHtml(customerName)}, ${escapeHtml(intro)}</p>
        </div>
        <div style="padding:28px 32px;">
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">
            <div style="border:1px solid rgba(0,113,227,0.1);background:#fbfcff;border-radius:18px;padding:14px 16px;">
              <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#86868b;font-weight:700;">Pedido</div>
              <div style="margin-top:8px;font-size:15px;font-weight:700;">${escapeHtml(order.codigo || `#${order.id}`)}</div>
            </div>
            <div style="border:1px solid rgba(0,113,227,0.1);background:#fbfcff;border-radius:18px;padding:14px 16px;">
              <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#86868b;font-weight:700;">Estado</div>
              <div style="margin-top:8px;font-size:15px;font-weight:700;">${escapeHtml(statusLabel)}</div>
            </div>
            <div style="border:1px solid rgba(0,113,227,0.1);background:#fbfcff;border-radius:18px;padding:14px 16px;">
              <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#86868b;font-weight:700;">Metodo</div>
              <div style="margin-top:8px;font-size:15px;font-weight:700;">${escapeHtml(methodLabel)}</div>
            </div>
            <div style="border:1px solid rgba(0,113,227,0.1);background:#fbfcff;border-radius:18px;padding:14px 16px;">
              <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#86868b;font-weight:700;">Total</div>
              <div style="margin-top:8px;font-size:15px;font-weight:700;">${escapeHtml(totalLabel)}</div>
            </div>
          </div>
          <div style="margin-top:24px;border:1px solid rgba(0,113,227,0.1);background:#fbfcff;border-radius:22px;padding:18px 20px;">
            <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#86868b;font-weight:700;">Siguiente paso</div>
            <p style="margin:12px 0 0;font-size:15px;line-height:1.8;color:#424245;">${escapeHtml(getStepsText(order))}</p>
          </div>
          <div style="margin-top:24px;">
            <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#86868b;font-weight:700;">Resumen de compra</div>
            <table style="width:100%;margin-top:10px;border-collapse:collapse;">
              <thead>
                <tr>
                  <th style="padding:0 0 10px;text-align:left;font-size:12px;color:#86868b;">Producto</th>
                  <th style="padding:0 0 10px;text-align:right;font-size:12px;color:#86868b;">Subtotal</th>
                </tr>
              </thead>
              <tbody>${payloadItems.length > 0 ? renderPayloadItems(payloadItems) : renderItems(order.pedido_web_items)}</tbody>
            </table>
          </div>
          <div style="margin-top:24px;border:1px solid rgba(0,113,227,0.1);background:#ffffff;border-radius:22px;padding:18px 20px;">
            <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#86868b;font-weight:700;">Entrega</div>
            <p style="margin:10px 0 0;font-size:15px;line-height:1.8;color:#424245;">${escapeHtml(city)}<br/>${escapeHtml(address)}</p>
          </div>
          <div style="margin-top:24px;border:1px solid rgba(0,113,227,0.1);background:#ffffff;border-radius:22px;padding:18px 20px;">
            <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#86868b;font-weight:700;">Soporte</div>
            <p style="margin:12px 0 0;font-size:15px;line-height:1.8;color:#424245;">Si respondes este correo o escribes a ventrabolivia@gmail.com, te ayudaremos con tu pedido.</p>
          </div>
          <div style="margin-top:28px;display:flex;flex-wrap:wrap;gap:12px;">
            <a href="${publicOrderUrl}" style="display:inline-block;background:#0071e3;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;">Ver mi pedido</a>
            <a href="${accountOrderUrl}" style="display:inline-block;background:#ffffff;color:#1d1d1f;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;border:1px solid rgba(0,113,227,0.1);">Ir a mi cuenta</a>
            ${whatsappHref ? `<a href="${whatsappHref}" style="display:inline-block;background:#25D366;color:#083a1f;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;">Continuar por WhatsApp</a>` : ''}
          </div>
          <p style="margin:22px 0 0;font-size:13px;line-height:1.8;color:#86868b;">Este correo fue enviado por VENTRA Bolivia a ${escapeHtml(order.cliente_correo || '')}.</p>
        </div>
      </div>
    </div>
  `

  const text = [
    title,
    '',
    `Pedido: ${order.codigo || `#${order.id}`}`,
    `Estado: ${statusLabel}`,
    `Metodo: ${methodLabel}`,
    `Total: ${totalLabel}`,
    `Ciudad: ${city}`,
    `Direccion: ${address}`,
    '',
    'Productos:',
    ...(order.pedido_web_items || []).map(
      (item) =>
        `- ${item.producto_nombre || 'Producto'} x${Math.max(Number(item.cantidad || 1), 1)} (${money.format(Number(item.subtotal || 0))})`
    ),
    '',
    `Siguiente paso: ${getStepsText(order)}`,
    '',
    `Pedido publico: ${publicOrderUrl}`,
    `Mi cuenta: ${accountOrderUrl}`,
    ...(whatsappHref ? [`WhatsApp: ${whatsappHref}`] : []),
  ].join('\n')

  return {
    subject: `${title} · ${order.codigo || `Pedido #${order.id}`}`,
    html,
    text,
    from: getFromAddress(),
  }
}

async function getOrderForQueue(orderId: number) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('pedidos_web')
    .select(
      'id,codigo,estado,cliente_nombre,cliente_correo,cliente_ciudad,cliente_direccion,metodo_pago,total,pedido_web_items(producto_nombre,cantidad,subtotal)'
    )
    .eq('id', orderId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data || null) as QueueOrder | null
}

async function sendEmailWithResend({
  to,
  subject,
  html,
  text,
  from,
  replyTo,
}: {
  to: string
  subject: string
  html: string
  text: string
  from: string
  replyTo: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: [replyTo],
      subject,
      html,
      text,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Resend error: ${body}`)
  }
}

export async function processStoreEmailQueue(limit = 12) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('store_email_notification_queue')
    .select('id,auth_user_id,pedido_web_id,event_type,recipient_email,payload,status')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  const queue = (data || []) as QueueRow[]
  let processed = 0
  let failed = 0

  for (const job of queue) {
    try {
      if (job.event_type === 'welcome_account') {
        const email = buildWelcomeEmailContent(job.payload || {}, job.recipient_email)
        await sendEmailWithResend({
          to: job.recipient_email,
          subject: email.subject,
          html: email.html,
          text: email.text,
          from: email.from,
          replyTo: getReplyToAddress(),
        })
      } else {
        if (!job.pedido_web_id) {
          throw new Error('Missing pedido_web_id in queue job.')
        }

        const order = await getOrderForQueue(job.pedido_web_id)
        if (!order) {
          throw new Error('Order not found for queue job.')
        }

        const email = buildOrderEmailContent(
          job.event_type,
          order,
          Array.isArray(job.payload?.items) ? (job.payload.items as QueuePayloadItem[]) : []
        )
        await sendEmailWithResend({
          to: job.recipient_email,
          subject: email.subject,
          html: email.html,
          text: email.text,
          from: email.from,
          replyTo: getReplyToAddress(),
        })
      }

      await supabase
        .from('store_email_notification_queue')
        .update({ status: 'processed' })
        .eq('id', job.id)

      processed += 1
    } catch (sendError) {
      await supabase
        .from('store_email_notification_queue')
        .update({
          status: 'failed',
          payload: {
            ...(job.payload || {}),
            last_error: sendError instanceof Error ? sendError.message : 'Unknown send error',
          },
        })
        .eq('id', job.id)

      failed += 1
    }
  }

  return {
    total: queue.length,
    processed,
    failed,
  }
}

export async function processStoreEmailQueueById(queueId: number) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('store_email_notification_queue')
    .select('id,auth_user_id,pedido_web_id,event_type,recipient_email,payload,status')
    .eq('id', queueId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  const job = (data || null) as QueueRow | null
  if (!job) {
    return { ok: false, reason: 'not_found' as const }
  }

  if (job.status !== 'pending') {
    return { ok: true, skipped: true as const, status: job.status }
  }

  try {
    if (job.event_type === 'welcome_account') {
      const email = buildWelcomeEmailContent(job.payload || {}, job.recipient_email)
      await sendEmailWithResend({
        to: job.recipient_email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        from: email.from,
        replyTo: getReplyToAddress(),
      })
    } else {
      if (!job.pedido_web_id) {
        throw new Error('Missing pedido_web_id in queue job.')
      }

      const order = await getOrderForQueue(job.pedido_web_id)
      if (!order) {
        throw new Error('Order not found for queue job.')
      }

      const email = buildOrderEmailContent(
        job.event_type,
        order,
        Array.isArray(job.payload?.items) ? (job.payload.items as QueuePayloadItem[]) : []
      )
      await sendEmailWithResend({
        to: job.recipient_email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        from: email.from,
        replyTo: getReplyToAddress(),
      })
    }

    await supabase
      .from('store_email_notification_queue')
      .update({ status: 'processed' })
      .eq('id', job.id)

    return { ok: true, processed: 1 }
  } catch (sendError) {
    await supabase
      .from('store_email_notification_queue')
      .update({
        status: 'failed',
        payload: {
          ...(job.payload || {}),
          last_error: sendError instanceof Error ? sendError.message : 'Unknown send error',
        },
      })
      .eq('id', job.id)

    throw sendError
  }
}
