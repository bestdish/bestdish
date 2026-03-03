/**
 * Instagram/Facebook webhook endpoint for Meta app verification.
 * Meta sends GET with hub.mode, hub.verify_token, hub.challenge — we return the challenge if the token matches.
 * Required by Meta when "webhooks" are enabled on the app; we use this only for verification, not for posting.
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')?.trim() ?? ''
  const challenge = searchParams.get('hub.challenge')?.trim() ?? ''
  const expected = (process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'bestdish-verify').trim()

  if (mode === 'subscribe' && token === expected && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(request: NextRequest) {
  // Meta may send webhook events here (comments, etc.). We don't use them for posting; acknowledge so Meta doesn't retry.
  return NextResponse.json({ received: true }, { status: 200 })
}
