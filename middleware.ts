import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check for existing session cookie first
    const sessionCookie = request.cookies.get('admin_session')
    const validUser = process.env.ADMIN_USERNAME || 'admin'
    const validPassword = process.env.ADMIN_PASSWORD || 'changeme123'
    const expectedSession = Buffer.from(`${validUser}:${validPassword}`).toString('base64')
    
    // If valid session exists, allow access
    if (sessionCookie && sessionCookie.value === expectedSession) {
      return NextResponse.next()
    }

    // Skip authentication for prefetch requests (prevents popup on hover/scroll)
    const purpose = request.headers.get('purpose')
    const secFetchDest = request.headers.get('sec-fetch-dest')
    
    if (purpose === 'prefetch' || secFetchDest === 'empty') {
      // For prefetch, return 401 without auth challenge to prevent popup
      return new NextResponse(null, { status: 401 })
    }

    // Check Basic Auth header
    const basicAuth = request.headers.get('authorization')

    if (basicAuth) {
      const authValue = basicAuth.split(' ')[1]
      const [user, pwd] = atob(authValue).split(':')

      if (user === validUser && pwd === validPassword) {
        // Create session cookie and allow access
        const response = NextResponse.next()
        response.cookies.set('admin_session', expectedSession, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 8, // 8 hours
          path: '/admin',
        })
        return response
      }
    }

    // If no auth or invalid, request authentication
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Panel"',
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}


