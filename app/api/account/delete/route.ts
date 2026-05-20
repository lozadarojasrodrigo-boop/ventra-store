import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  let body: { confirmation?: string } | null = null

  try {
    body = (await request.json()) as { confirmation?: string }
  } catch {
    body = null
  }

  if ((body?.confirmation || '').trim().toUpperCase() !== 'ELIMINAR') {
    return NextResponse.json(
      { error: 'Debes escribir ELIMINAR para confirmar.' },
      { status: 400 }
    )
  }

  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'No se pudo identificar la cuenta.' }, { status: 401 })
  }

  await supabase.auth.signOut()

  const admin = getSupabaseAdmin()
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
