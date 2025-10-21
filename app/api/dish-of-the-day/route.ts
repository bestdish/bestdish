import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPublicImageUrl } from '@/lib/imageUrl'

/**
 * GET /api/dish-of-the-day
 * Returns a random approved dish with high ratings for Instagram automation
 */
export async function GET() {
  try {
    // Get dishes with approved reviews and good ratings
    const topDishes = await prisma.dish.findMany({
      where: {
        reviews: {
          some: {
            approved: true
          }
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
            approved: true
          },
          select: {
            rating: true
          }
        }
      }
    })

    if (topDishes.length === 0) {
      return NextResponse.json({
        error: 'No dishes with reviews found'
      }, { status: 404 })
    }

    // Calculate average ratings and filter for high-rated dishes
    const dishesWithRatings = topDishes.map(dish => {
      const ratingsOnly = dish.reviews.filter(r => r.rating !== null).map(r => r.rating!)
      const averageRating = ratingsOnly.length > 0
        ? ratingsOnly.reduce((sum, rating) => sum + rating, 0) / ratingsOnly.length
        : 0

      return {
        ...dish,
        averageRating,
        reviewCount: ratingsOnly.length
      }
    })

    // Filter for dishes with 4+ stars and at least 3 reviews
    const highRatedDishes = dishesWithRatings.filter(dish => 
      dish.averageRating >= 4.0 && dish.reviewCount >= 3
    )

    // If no high-rated dishes, fall back to any dishes with reviews
    const candidateDishes = highRatedDishes.length > 0 ? highRatedDishes : dishesWithRatings

    // Select a random dish
    const randomIndex = Math.floor(Math.random() * candidateDishes.length)
    const selectedDish = candidateDishes[randomIndex]

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const dishUrl = `${baseUrl}/${selectedDish.restaurant.city.slug}/${selectedDish.restaurant.slug}/${selectedDish.slug}`

    // Prepare Instagram-ready content
    const response = {
      dish: {
        id: selectedDish.id,
        name: selectedDish.name,
        description: selectedDish.description,
        averageRating: selectedDish.averageRating,
        reviewCount: selectedDish.reviewCount,
        url: dishUrl
      },
      restaurant: {
        name: selectedDish.restaurant.name,
        city: selectedDish.restaurant.city.name,
        cuisine: selectedDish.restaurant.cuisine,
        rating: selectedDish.restaurant.rating
      },
      image: selectedDish.photoUrl ? {
        url: getPublicImageUrl('dish-photos', selectedDish.photoUrl),
        alt: `${selectedDish.name} at ${selectedDish.restaurant.name}`
      } : null,
      socialMedia: {
        caption: `🍽️ ${selectedDish.name} at ${selectedDish.restaurant.name} in ${selectedDish.restaurant.city.name}\n\n⭐ Rated ${selectedDish.averageRating.toFixed(1)}/5 by ${selectedDish.reviewCount} reviewers\n\n📍 ${selectedDish.restaurant.city.name}\n\n#BestDish #${selectedDish.restaurant.city.name.replace(/\s+/g, '')} #${selectedDish.restaurant.cuisine?.replace(/\s+/g, '') || 'Restaurant'} #Foodie #FoodDiscovery`,
        hashtags: [
          'BestDish',
          selectedDish.restaurant.city.name.replace(/\s+/g, ''),
          selectedDish.restaurant.cuisine?.replace(/\s+/g, '') || 'Restaurant',
          'Foodie',
          'FoodDiscovery',
          'LocalEats'
        ]
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    })

  } catch (error) {
    console.error('Error fetching dish of the day:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



