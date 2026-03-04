import { NextResponse } from 'next/server'

/**
 * GET /api/instagram/token-check?secret=YOUR_SECRET
 * Verifies INSTAGRAM_GRAPH_ACCESS_TOKEN by calling Meta's API.
 * In production, set INSTAGRAM_TOKEN_CHECK_SECRET and pass ?secret= that value.
 * Returns token info (length, prefix) and Meta's response (id, username or error).
 */
export async function GET(request: Request) {
  const isDev = process.env.NODE_ENV === 'development'
  const secret = process.env.INSTAGRAM_TOKEN_CHECK_SECRET
  const url = new URL(request.url)
  if (!isDev && secret && url.searchParams.get('secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawToken = process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN
  const token = rawToken?.replace(/\s+/g, '').trim()
  if (!token) {
    return NextResponse.json({
      ok: false,
      error: 'INSTAGRAM_GRAPH_ACCESS_TOKEN not set',
    })
  }

  try {
    const res = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=id,username&access_token=${encodeURIComponent(token)}`
    )
    const data = (await res.json()) as { id?: string; username?: string; error?: { message: string; code?: number } }
    const ok = !data.error && typeof data.id === 'string'
    return NextResponse.json({
      ok,
      tokenLength: token.length,
      tokenPrefix: token.slice(0, 4),
      metaResponse: data,
    })
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : 'Request failed',
    })
  }
}
