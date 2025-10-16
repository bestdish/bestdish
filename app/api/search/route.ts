import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Ensure no caching - always fetch fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = query.trim().toLowerCase()

    // Search dishes (prioritized)
    const dishes = await prisma.dish.findMany({
      where: {
        isBest: true,
        name: {
          contains: searchTerm,
          mode: 'insensitive'
        },
        restaurant: {
          isActive: true
        }
      },
      include: {
        restaurant: {
          include: {
            city: true
          }
        },
        reviews: {
          where: {
            approved: true,
            rating: {
              not: null
            }
          },
          select: {
            rating: true
          }
        }
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Search restaurants (if we need more results)
    const remainingSlots = 5 - dishes.length
    const restaurants = remainingSlots > 0 ? await prisma.restaurant.findMany({
      where: {
        isActive: true,
        name: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      include: {
        city: true,
        dishes: {
          where: {
            isBest: true
          },
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      take: remainingSlots,
      orderBy: {
        name: 'asc'
      }
    }) : []

    // Format dish results
    const dishResults = dishes.map(dish => {
      const ratings = dish.reviews.filter(r => r.rating).map(r => r.rating as number)
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
        : null

      return {
        type: 'dish' as const,
        id: dish.id,
        name: dish.name,
        slug: dish.slug,
        restaurantName: dish.restaurant.name,
        restaurantSlug: dish.restaurant.slug,
        cityName: dish.restaurant.city.name,
        citySlug: dish.restaurant.city.slug,
        rating: avgRating ? Number(avgRating.toFixed(1)) : null,
        ratingCount: ratings.length,
        url: `/${dish.restaurant.city.slug}/${dish.restaurant.slug}/${dish.slug}`
      }
    })

    // Format restaurant results
    const restaurantResults = restaurants.map(restaurant => ({
      type: 'restaurant' as const,
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      cityName: restaurant.city.name,
      citySlug: restaurant.city.slug,
      dishCount: restaurant.dishes.length,
      url: `/${restaurant.city.slug}/${restaurant.slug}`
    }))

    // Combine and limit to 5 total results
    const results = [...dishResults, ...restaurantResults].slice(0, 5)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
}

