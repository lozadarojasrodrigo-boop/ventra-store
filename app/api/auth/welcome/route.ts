import { NextResponse } from 'next/server'

import { processStoreEmailQueueById } from '@/lib/store/email-queue'
import { enqueueStoreNotification } from '@/lib/store/notifications'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

type WelcomePayload = {
  userId?: string
  email?: string
  firstName?: string
  lastName?: string
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: Request) {
  let body: WelcomePayload | null = null

  try {
    body = (await request.json()) as WelcomePayload
  } catch {
    body = null
  }

  const userId = cleanText(body?.userId)
  const email = cleanText(body?.email).toLowerCase()
  const firstName = cleanText(body?.firstName)
  const lastName = cleanText(body?.lastName)

  if (!userId || !email) {
    return NextResponse.json({ error: 'Missing user data.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(userId)

  if (authUserError || !authUserData.user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }

  if ((authUserData.user.email || '').trim().toLowerCase() !== email) {
    return NextResponse.json({ error: 'User email mismatch.' }, { status: 400 })
  }

  const { data: existingQueue } = await supabase
    .from('store_email_notification_queue')
    .select('id')
    .eq('auth_user_id', userId)
    .eq('event_type', 'welcome_account')
    .limit(1)
    .maybeSingle()

  if (existingQueue) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const { data: queueInsert, error: queueInsertError } = await supabase
    .from('store_email_notification_queue')
    .insert({
      auth_user_id: userId,
      pedido_web_id: null,
      recipient_email: email,
      event_type: 'welcome_account',
      payload: {
        first_name: firstName,
        last_name: lastName,
        full_name: [firstName, lastName].filter(Boolean).join(' '),
      },
      status: 'pending',
    })
    .select('id')
    .single()

  if (queueInsertError || !queueInsert) {
    await enqueueStoreNotification(supabase, {
      authUserId: userId,
      recipientEmail: email,
      eventType: 'welcome_account',
      payload: {
        first_name: firstName,
        last_name: lastName,
        full_name: [firstName, lastName].filter(Boolean).join(' '),
      },
    })

    return NextResponse.json({ ok: true, queued: true })
  }

  try {
    await processStoreEmailQueueById(queueInsert.id)
  } catch {
    return NextResponse.json({ ok: true, queued: true })
  }

  return NextResponse.json({ ok: true, sent: true })
}
