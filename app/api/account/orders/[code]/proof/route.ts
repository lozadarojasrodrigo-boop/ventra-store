import { NextResponse } from 'next/server'

import { enqueueStoreNotification } from '@/lib/store/notifications'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const bucketName = 'web-order-proofs'
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])

function getFileExtension(fileName: string) {
  const segments = fileName.split('.')
  return segments.length > 1 ? segments.pop()!.toLowerCase() : 'bin'
}

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Debes iniciar sesion.' }, { status: 401 })
  }

  const { code } = await context.params
  const formData = await request.formData().catch(() => null)
  const proof = formData?.get('proof')

  if (!(proof instanceof File)) {
    return NextResponse.json({ error: 'Selecciona un archivo valido.' }, { status: 400 })
  }

  if (!allowedMimeTypes.has(proof.type)) {
    return NextResponse.json({ error: 'Solo se permiten JPG, PNG, WEBP o PDF.' }, { status: 400 })
  }

  if (proof.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'El comprobante no puede superar 5 MB.' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const { data: order, error: orderError } = await admin
    .from('pedidos_web')
    .select('id,codigo,estado,metodo_pago,payment_proof_path,cliente_correo')
    .eq('auth_user_id', user.id)
    .eq('codigo', code)
    .maybeSingle()

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 400 })
  }

  if (!order) {
    return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 })
  }

  if (order.metodo_pago === 'efectivo') {
    return NextResponse.json({ error: 'Este pedido no requiere comprobante.' }, { status: 400 })
  }

  const extension = getFileExtension(proof.name || 'proof')
  const objectPath = `${user.id}/${order.codigo || order.id}-${Date.now()}.${extension}`
  const arrayBuffer = await proof.arrayBuffer()

  const uploadResult = await admin.storage.from(bucketName).upload(objectPath, Buffer.from(arrayBuffer), {
    contentType: proof.type,
    upsert: true,
  })

  if (uploadResult.error) {
    return NextResponse.json({ error: uploadResult.error.message }, { status: 400 })
  }

  if (order.payment_proof_path) {
    await admin.storage.from(bucketName).remove([order.payment_proof_path]).catch(() => undefined)
  }

  const nextStatus = order.estado === 'pendiente' ? 'pago_en_revision' : order.estado
  const { error: updateError } = await admin
    .from('pedidos_web')
    .update({
      payment_proof_path: objectPath,
      payment_proof_uploaded_at: new Date().toISOString(),
      estado: nextStatus,
      conversion_note: 'Comprobante cargado por el cliente desde la web.',
    })
    .eq('id', order.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  await enqueueStoreNotification(admin, {
    authUserId: user.id,
    orderId: Number(order.id),
    recipientEmail: typeof order.cliente_correo === 'string' ? order.cliente_correo : '',
    eventType: 'payment_review',
    payload: {
      codigo: order.codigo,
      metodo_pago: order.metodo_pago,
      estado: nextStatus,
    },
  })

  const {
    data: { publicUrl },
  } = admin.storage.from(bucketName).getPublicUrl(objectPath)

  return NextResponse.json({
    ok: true,
    proofUrl: publicUrl,
    status: nextStatus,
  })
}
