import { NextResponse } from 'next/server'

/**
 * GET /api/instagram/ig-user-id?secret=YOUR_SECRET
 * For EAA (Facebook) tokens: fetches your Pages and their linked Instagram Business account IDs.
 * Use the instagram_business_account.id for the Page that owns bestdish.mcr as INSTAGRAM_IG_USER_ID.
 * In production, set INSTAGRAM_TOKEN_CHECK_SECRET and pass ?secret= that value.
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
      error: 'INSTAGRAM_GRAPH_ACCESS_TOKEN not set',
    }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=name,instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}`
    )
    const data = (await res.json()) as {
      data?: Array<{ id: string; name: string; instagram_business_account?: { id: string; username?: string } }>
      error?: { message: string; code?: number }
    }
    if (data.error) {
      return NextResponse.json({
        error: data.error.message,
        hint: 'Make sure your token has pages_show_list (and possibly pages_read_engagement) permission.',
      }, { status: 400 })
    }
    const pages = data.data ?? []
    return NextResponse.json({
      message: 'Use instagram_business_account.id for the Page that owns bestdish.mcr as INSTAGRAM_IG_USER_ID in .env and Vercel.',
      pages: pages.map((p) => ({
        pageName: p.name,
        pageId: p.id,
        instagramBusinessAccount: p.instagram_business_account
          ? { id: p.instagram_business_account.id, username: p.instagram_business_account.username }
          : null,
      })),
    })
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : 'Request failed',
    }, { status: 500 })
  }
}
