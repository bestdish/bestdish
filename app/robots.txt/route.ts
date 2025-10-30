import { NextResponse } from 'next/server'

export async function GET() {
  // Always use production URL for robots.txt - ignore localhost env vars
  let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bestdish.co.uk'
  
  // If env var is set to localhost (dev), use production URL instead
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    baseUrl = 'https://bestdish.co.uk'
  }
  
  const robots = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin pages
Disallow: /admin/
Disallow: /api/

# Allow important pages
Allow: /login
Allow: /auth/callback`

  return new NextResponse(robots, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}









