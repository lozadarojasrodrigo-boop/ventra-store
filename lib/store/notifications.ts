import type { SupabaseClient } from '@supabase/supabase-js'

type NotificationPreferenceRow = {
  email_order_received: boolean | null
  email_payment_review: boolean | null
  email_payment_confirmed: boolean | null
  email_order_sent: boolean | null
  email_order_delivered: boolean | null
}

type QueueEventType =
  | 'welcome_account'
  | 'order_received'
  | 'payment_review'
  | 'payment_confirmed'
  | 'order_sent'
  | 'order_delivered'

type QueuePayload = {
  authUserId?: string | null
  orderId?: number | null
  recipientEmail?: string | null
  eventType: QueueEventType
  payload?: Record<string, unknown>
}

const preferenceMap: Record<
  Exclude<QueueEventType, 'welcome_account'>,
  keyof NotificationPreferenceRow
> = {
  order_received: 'email_order_received',
  payment_review: 'email_payment_review',
  payment_confirmed: 'email_payment_confirmed',
  order_sent: 'email_order_sent',
  order_delivered: 'email_order_delivered',
}

export async function enqueueStoreNotification(
  admin: SupabaseClient,
  { authUserId = null, orderId = null, recipientEmail, eventType, payload = {} }: QueuePayload
) {
  const cleanEmail = typeof recipientEmail === 'string' ? recipientEmail.trim() : ''
  if (!cleanEmail) {
    return
  }

  if (authUserId && eventType !== 'welcome_account') {
    const { data, error } = await admin
      .from('store_customer_notification_preferences')
      .select(
        'email_order_received,email_payment_review,email_payment_confirmed,email_order_sent,email_order_delivered'
      )
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (!error && data) {
      const row = data as NotificationPreferenceRow
      if (row[preferenceMap[eventType as Exclude<QueueEventType, 'welcome_account'>]] === false) {
        return
      }
    }
  }

  await admin.from('store_email_notification_queue').insert({
    auth_user_id: authUserId,
    pedido_web_id: orderId,
    recipient_email: cleanEmail,
    event_type: eventType,
    payload,
    status: 'pending',
  })
}
