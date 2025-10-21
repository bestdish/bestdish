import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - don't try to generate at build time
export const dynamic = 'force-dynamic'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  try {
    // Get all cities
    const cities = await prisma.city.findMany({
      select: { slug: true, updatedAt: true }
    })
    
    // Get all restaurants
    const restaurants = await prisma.restaurant.findMany({
      where: { isActive: true },
      select: { 
        slug: true, 
        updatedAt: true,
        city: { select: { slug: true } }
      }
    })
    
    // Get all dishes
    const dishes = await prisma.dish.findMany({
      select: { 
        slug: true, 
        updatedAt: true,
        restaurant: { 
          select: { 
            slug: true,
            city: { select: { slug: true } }
          }
        }
      }
    })

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Cities -->
  ${cities.map(city => `
  <url>
    <loc>${baseUrl}/${city.slug}</loc>
    <lastmod>${city.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  
  <!-- Restaurants -->
  ${restaurants.map(restaurant => `
  <url>
    <loc>${baseUrl}/${restaurant.city.slug}/${restaurant.slug}</loc>
    <lastmod>${restaurant.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  
  <!-- Dishes -->
  ${dishes.map(dish => `
  <url>
    <loc>${baseUrl}/${dish.restaurant.city.slug}/${dish.slug}</loc>
    <lastmod>${dish.updatedAt.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
  
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/login</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}




