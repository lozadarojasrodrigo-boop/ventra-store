import { NextResponse } from 'next/server'

import { processStoreEmailQueue } from '@/lib/store/email-queue'

function isAuthorized(request: Request) {
  const cronHeader = request.headers.get('x-vercel-cron')
  if (cronHeader) {
    return true
  }

  const secret = process.env.CRON_SECRET
  if (!secret) {
    return process.env.NODE_ENV !== 'production'
  }

  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await processStoreEmailQueue()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Email queue processing failed.',
      },
      { status: 500 }
    )
  }
}
